import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MeetingEvent, TranscriptStatus } from '@/entities';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class MeetingEventSchedulerService {
  private readonly logger = new Logger(MeetingEventSchedulerService.name);

  constructor(
    @InjectRepository(MeetingEvent)
    private readonly meetingEventRepository: Repository<MeetingEvent>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Cron('0 0 1 * * *') // 每天01:00执行
  async subscribeRecentMeetings(): Promise<void> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      const events = await this.meetingEventRepository.find({
        where: {
          startTime: Between(startOfDay, endOfDay),
          transcriptStatus: TranscriptStatus.NONE,
        },
      });

      if (events.length === 0) {
        this.logger.log('✅ 最近 5 分钟没有会议需要订阅 transcript');
        return;
      }

      for (const event of events) {
        try {
          this.logger.log(`📄 为会议创建 transcript 订阅: eventId=${event.eventId}, meetingId=${event.meetingId}`);
          
          if (event.meetingId) {
            await this.subscriptionService.createTranscriptSubscription(event.meetingId);
            
            event.transcriptStatus = TranscriptStatus.SUBSCRIBED;
            await this.meetingEventRepository.save(event);
            this.logger.log(`✅ 已更新会议 ${event.eventId} 状态为 subscribed`);
          }
        } catch (error) {
          this.logger.error(`❌ 为会议 ${event.eventId} 创建订阅失败: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error('❌ 订阅会议失败:', error.message);
    }
  }
}