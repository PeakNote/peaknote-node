import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingEvent, TranscriptStatus } from '@/entities';
import { GraphService } from './graph.service';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class GraphEventService {
  private readonly logger = new Logger(GraphEventService.name);

  constructor(
    @InjectRepository(MeetingEvent)
    private readonly meetingEventRepository: Repository<MeetingEvent>,
    private readonly graphService: GraphService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async processEvent(userId: string, eventId: string, isRecurring: boolean): Promise<void> {
    try {
      const event = await this.graphService.getUserEvent(userId, eventId);

      if (isRecurring) {
        await this.addSeriesInstances(userId, eventId);
      } else {
        const meetingEvent = await this.convertEvent(event, userId);
        await this.meetingEventRepository.save(meetingEvent);
      }
    } catch (error) {
      this.logger.error(`❌ 处理事件失败: ${error.message}`);
      throw error;
    }
  }

  async addSeriesInstances(userId: string, seriesMasterId: string): Promise<void> {
    try {
      const startDateTime = new Date().toISOString();
      const endDateTime = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(); // 6 months

      const occurrences = await this.graphService.getEventOccurrences(
        userId,
        seriesMasterId,
        startDateTime,
        endDateTime,
      );

      if (!occurrences.value || occurrences.value.length === 0) {
        this.logger.log('✅ 没有 occurrence（可能太早）');
        return;
      }

      for (const occurrence of occurrences.value) {
        const meetingEvent = await this.convertEvent(occurrence, userId);
        await this.meetingEventRepository.save(meetingEvent);
      }
    } catch (error) {
      this.logger.error(`❌ 添加系列实例失败: ${error.message}`);
      throw error;
    }
  }

  private async convertEvent(event: any, userId: string): Promise<MeetingEvent> {
    const entity = new MeetingEvent();
    entity.eventId = event.id;
    entity.userId = userId;
    entity.subject = event.subject;
    entity.joinUrl = event.onlineMeeting ? decodeURIComponent(event.onlineMeeting.joinUrl) : null;
    entity.startTime = this.parseGraphDateTime(event.start?.dateTime);
    entity.endTime = this.parseGraphDateTime(event.end?.dateTime);

    // 判断是否为当天的会议
    const isToday = entity.startTime && 
      new Date(entity.startTime).toDateString() === new Date().toDateString();

    if (event.onlineMeeting && event.onlineMeeting.joinUrl) {
      try {
        const meetings = await this.graphService.getOnlineMeetingsByJoinUrl(
          userId,
          event.onlineMeeting.joinUrl,
        );

        if (meetings.value && meetings.value.length > 0) {
          const meetingId = meetings.value[0].id;
          entity.meetingId = meetingId;

          if (isToday) {
            try {
              await this.subscriptionService.createTranscriptSubscription(meetingId);
              entity.transcriptStatus = TranscriptStatus.SUBSCRIBED;
            } catch (error) {
              this.logger.warn(`⚠️ 创建转录订阅失败: ${error.message}`);
              entity.transcriptStatus = TranscriptStatus.NONE;
            }
          }
        }
      } catch (error) {
        this.logger.warn(`⚠️ 获取在线会议失败: ${error.message}`);
      }
    }

    return entity;
  }

  private parseGraphDateTime(dateTimeStr: string): Date | null {
    if (!dateTimeStr) return null;
    
    try {
      const cleaned = dateTimeStr.includes('.') 
        ? dateTimeStr.substring(0, dateTimeStr.indexOf('.')) 
        : dateTimeStr;
      return new Date(cleaned + 'Z');
    } catch (error) {
      this.logger.warn(`⚠️ 解析日期时间失败: ${dateTimeStr}`);
      return null;
    }
  }
}