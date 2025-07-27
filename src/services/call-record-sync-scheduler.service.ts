import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GraphService } from './graph.service';
import { TranscriptService } from './transcript.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingEvent, TranscriptStatus } from '@/entities';

@Injectable()
export class CallRecordSyncScheduler {
  private readonly logger = new Logger(CallRecordSyncScheduler.name);

  constructor(
    private readonly graphService: GraphService,
    private readonly transcriptService: TranscriptService,
    @InjectRepository(MeetingEvent)
    private readonly meetingEventRepository: Repository<MeetingEvent>,
  ) {}

  @Cron('0 */5 * * * *') // Every 5 minutes
  async syncCallRecords(): Promise<void> {
    try {
      this.logger.log('🚀 开始检查会议转录...');
      
      // Find meetings from today that might have transcripts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const recentMeetings = await this.meetingEventRepository.find({
        where: {
          transcriptStatus: TranscriptStatus.SUBSCRIBED,
        },
      });

      this.logger.log(`📝 发现 ${recentMeetings.length} 个会议需要检查转录`);

      for (const meeting of recentMeetings) {
        try {
          // Check if meeting has ended (wait 10 minutes after end time)
          const meetingEndTime = new Date(meeting.endTime);
          const now = new Date();
          const timeSinceEnd = now.getTime() - meetingEndTime.getTime();
          
          if (timeSinceEnd > 10 * 60 * 1000) { // 10 minutes after meeting ended
            this.logger.log(`🔍 检查会议转录: ${meeting.meetingId}`);
            
            // Try to fetch transcript
            await this.transcriptService.downloadTranscriptContent(
              meeting.userId,
              meeting.meetingId,
              'transcript-id', // We'll need to get actual transcript ID
              'access-token'   // We'll need to get actual access token
            );
            
            // Update status to avoid checking again
            meeting.transcriptStatus = TranscriptStatus.PROCESSING;
            await this.meetingEventRepository.save(meeting);
          }
        } catch (error) {
          this.logger.warn(`⚠️ 检查会议 ${meeting.meetingId} 转录失败: ${error.message}`);
        }
      }
      
    } catch (error) {
      this.logger.error('❌ 同步 call records 出错:', error.message);
    }
  }
}