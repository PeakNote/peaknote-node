import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import Redis from 'ioredis';
import Redlock from 'redlock';
import { MeetingEvent, MeetingTranscript, TranscriptStatus } from '@/entities';
import { MeetingSummaryService } from './meeting-summary.service';
import { GraphService } from './graph.service';

@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);
  private readonly redis: Redis;
  private readonly redlock: Redlock;

  constructor(
    @InjectRepository(MeetingEvent)
    private readonly meetingEventRepository: Repository<MeetingEvent>,
    @InjectRepository(MeetingTranscript)
    private readonly meetingTranscriptRepository: Repository<MeetingTranscript>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly meetingSummaryService: MeetingSummaryService,
    private readonly graphService: GraphService,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
    });

    this.redlock = new Redlock([this.redis], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
    });
  }

  async downloadTranscriptContent(
    userId: string,
    meetingId: string,
    transcriptId: string,
    accessToken: string,
  ): Promise<void> {
    try {
      const url = `https://graph.microsoft.com/beta/users/${userId}/onlineMeetings/${meetingId}/transcripts/${transcriptId}/content`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'text/vtt',
        },
      });

      if (response.ok) {
        const content = await response.text();
        this.logger.log('✅ 成功获取 transcript 内容，准备保存数据库');
        console.log(content);

        const summary = await this.meetingSummaryService.generateSummary(content);
        console.log(summary);

        const meetingEvent = await this.meetingEventRepository.findOne({
          where: { meetingId, transcriptStatus: TranscriptStatus.SUBSCRIBED },
        });

        if (!meetingEvent) {
          this.logger.error(`❌ 未找到对应会议事件，meetingId=${meetingId}`);
          return;
        }

        const transcript = new MeetingTranscript();
        transcript.meetingEvent = meetingEvent;
        transcript.contentText = summary;
        transcript.createdAt = new Date();

        await this.meetingTranscriptRepository.save(transcript);
        this.logger.log(`✅ 已保存 transcript 到数据库，eventId=${meetingEvent.eventId}, transcriptId=${transcript.id}`);

        meetingEvent.transcriptStatus = TranscriptStatus.SAVED;
        await this.meetingEventRepository.save(meetingEvent);
        this.logger.log(`✅ 已更新事件 ${meetingEvent.eventId} 状态为 saved`);
      } else {
        this.logger.error(`❌ 下载 transcript 失败，状态码: ${response.status}, 内容: ${await response.text()}`);
      }
    } catch (error) {
      this.logger.error(`❌ 下载 transcript 出错: ${error.message}`, error.stack);
    }
  }

  async getEventIdsByUrl(url: string): Promise<string[]> {
    const cacheKey = `urlEventCache::${url}`;
    
    // Try cache first
    const cached = await this.cacheManager.get<string[]>(cacheKey);
    if (cached) {
      this.logger.log(`✅ 从缓存加载 EventId 列表，url=${url}, eventIds=${cached}`);
      return cached;
    }

    this.logger.log(`准备查询的 URL 长度: ${url.length}`);
    this.logger.log(`准备查询的 URL: '${url}'`);

    const eventIds = await this.meetingEventRepository
      .createQueryBuilder('event')
      .select('event.eventId')
      .where('event.joinUrl = :url', { url })
      .getMany()
      .then(events => events.map(e => e.eventId));

    if (eventIds.length > 0) {
      await this.cacheManager.set(cacheKey, eventIds, 3600000); // 1 hour
      this.logger.log(`✅ 从数据库加载 EventId 列表，url=${url}, eventIds=${eventIds}`);
      return eventIds;
    } else {
      await this.cacheManager.set(cacheKey, null, 3600000);
      this.logger.warn(`⚠️ 未找到 url，url=${url}`);
      return null;
    }
  }

  async getTranscriptByEventId(eventId: string): Promise<string> {
    const cacheKey = `transcriptCache::${eventId}`;
    
    // Try cache first
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.log(`✅ 从缓存加载 transcript，eventId=${eventId}`);
      return cached;
    }

    const transcript = await this.meetingTranscriptRepository.findOne({
      where: { meetingEvent: { eventId } },
      relations: ['meetingEvent'],
    });

    if (transcript) {
      await this.cacheManager.set(cacheKey, transcript.contentText, 3600000);
      this.logger.log(`✅ 从数据库加载 transcript，eventId=${eventId}`);
      return transcript.contentText;
    } else {
      await this.cacheManager.set(cacheKey, null, 3600000);
      this.logger.warn(`⚠️ 未找到 transcript，eventId=${eventId}`);
      return null;
    }
  }

  async updateTranscript(eventId: string, newContent: string): Promise<void> {
    const lockKey = `lock:transcript:${eventId}`;
    
    try {
      const lock = await this.redlock.acquire([lockKey], 30000); // 30 second lock
      
      try {
        this.logger.log(`成功获取分布式锁，eventId=${eventId}`);
        
        // Delete cache first
        await this.cacheManager.del(`transcriptCache::${eventId}`);
        
        // Update database
        await this.meetingTranscriptRepository
          .createQueryBuilder()
          .update()
          .set({ contentText: newContent })
          .where('meetingEvent.eventId = :eventId', { eventId })
          .execute();
        
        this.logger.log(`✅ 已更新数据库中的 transcript，eventId=${eventId}`);

        // Delayed double delete
        setTimeout(async () => {
          await this.cacheManager.del(`transcriptCache::${eventId}`);
          this.logger.log(`✅ 延迟双删完成，eventId=${eventId}`);
        }, 500);

      } finally {
        await lock.release();
        this.logger.log(`✅ 已释放锁，eventId=${eventId}`);
      }
    } catch (error) {
      this.logger.warn(`⚠️ 获取锁超时或失败，eventId=${eventId}`, error.message);
      throw error;
    }
  }
}