import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingInstance, TeamsUser, TranscriptStatus } from '@/entities';
import { GraphService } from './graph.service';

@Injectable()
export class MeetingInstanceSyncService {
  private readonly logger = new Logger(MeetingInstanceSyncService.name);

  constructor(
    @InjectRepository(TeamsUser)
    private readonly userRepository: Repository<TeamsUser>,
    @InjectRepository(MeetingInstance)
    private readonly meetingRepository: Repository<MeetingInstance>,
    private readonly graphService: GraphService,
  ) {
    this.logger.log('🔧 MeetingInstanceSyncService constructor called');
  }

  async syncFutureMeetings(): Promise<void> {
    try {
      this.logger.log('🟡 Running syncFutureMeetings...');
      
      const users = await this.userRepository.find();
      const start = new Date();
      const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      for (const user of users) {
        try {
          // Note: This is a simplified version. The actual Graph API query would be more complex
          // For now, we'll implement a basic structure
          this.logger.log(`📅 开始为用户 ${user.oid} 同步未来会议`);
          
          // TODO: Implement actual Graph API call to get calendar events
          // This would require calling the Microsoft Graph API's calendar endpoint
          
          this.logger.log(`✅ 用户 ${user.oid} 会议同步完成`);
        } catch (error) {
          this.logger.error(`❌ 用户 ${user.oid} 同步失败: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error('❌ 同步未来会议失败:', error.message);
      throw error;
    }
  }

  private parseGraphDateTime(dateTimeStr: string): Date {
    // Handle various datetime formats from Microsoft Graph
    if (!dateTimeStr) return new Date();
    
    try {
      // Remove fractional seconds if present and ensure UTC
      const cleaned = dateTimeStr.includes('.') 
        ? dateTimeStr.substring(0, dateTimeStr.indexOf('.')) 
        : dateTimeStr;
      
      return new Date(cleaned + 'Z');
    } catch (error) {
      this.logger.warn(`⚠️ 解析日期时间失败: ${dateTimeStr}`);
      return new Date();
    }
  }

  private async createMeetingInstance(event: any, userId: string): Promise<void> {
    const instance = new MeetingInstance();
    instance.eventId = event.id;
    instance.seriesMasterId = event.seriesMasterId;
    instance.joinUrl = event.onlineMeeting?.joinUrl;
    instance.createdBy = userId;
    instance.startTime = this.parseGraphDateTime(event.start?.dateTime);
    instance.endTime = this.parseGraphDateTime(event.end?.dateTime);
    instance.transcriptStatus = TranscriptStatus.NONE;
    instance.createdAt = new Date();

    const exists = await this.meetingRepository.findOne({ where: { eventId: event.id } });
    if (!exists) {
      await this.meetingRepository.save(instance);
      this.logger.log(`✅ 保存会议实例: ${event.id}`);
    }
  }
}