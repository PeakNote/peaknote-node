import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { GraphEventService } from './graph-event.service';

@Injectable()
export class MessageConsumer {
  private readonly logger = new Logger(MessageConsumer.name);
  private connection: any = null;
  private channel: any = null;

  constructor(private readonly graphEventService: GraphEventService) {
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
      this.logger.log(`📥 尝试连接 RabbitMQ: ${rabbitmqUrl}`);
      
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      // Ensure queues exist
      await this.channel.assertQueue('event-queue', { durable: true });
      await this.channel.assertQueue('transcript-queue', { durable: true });
      
      // Start consuming messages
      this.startConsuming();
      
      this.logger.log('✅ MessageConsumer 连接成功');
    } catch (error) {
      this.logger.warn(`⚠️ MessageConsumer 连接失败: ${error.message}`);
    }
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel) return;

    // Consume event messages
    await this.channel.consume('event-queue', async (msg) => {
      if (msg) {
        try {
          const content = msg.content.toString();
          const payload = JSON.parse(content);
          
          this.logger.log('📥 处理事件消息');
          await this.processEventMessage(payload);
          
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`❌ 处理事件消息失败: ${error.message}`);
          this.channel.nack(msg, false, false); // Reject and don't requeue
        }
      }
    });

    // Consume transcript messages
    await this.channel.consume('transcript-queue', async (msg) => {
      if (msg) {
        try {
          const content = msg.content.toString();
          const payload = JSON.parse(content);
          
          this.logger.log('📥 处理转录消息');
          await this.processTranscriptMessage(payload);
          
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`❌ 处理转录消息失败: ${error.message}`);
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  private async processEventMessage(payload: any): Promise<void> {
    try {
      if (!payload.value || !Array.isArray(payload.value)) {
        this.logger.warn('⚠️ 无效的事件负载格式');
        return;
      }

      for (const notification of payload.value) {
        const { resource, changeType, resourceData } = notification;
        
        this.logger.log(`📝 处理事件: ${changeType} - ${resource}`);
        
        // Extract user ID and event ID from resource path
        // Resource format: /users/{userId}/events/{eventId}
        const resourceMatch = resource.match(/\/users\/([^\/]+)\/events\/([^\/]+)/);
        if (resourceMatch) {
          const [, userId, eventId] = resourceMatch;
          
          // Check if this is a recurring event
          const isRecurring = resourceData?.isCancelled === false && resourceData?.seriesMasterId;
          
          await this.graphEventService.processEvent(userId, eventId, isRecurring);
        }
      }
    } catch (error) {
      this.logger.error(`❌ 处理事件消息失败: ${error.message}`);
      throw error;
    }
  }

  private async processTranscriptMessage(payload: any): Promise<void> {
    try {
      this.logger.log('🎙️ 处理转录消息');
      
      if (!payload.value || !Array.isArray(payload.value)) {
        this.logger.warn('⚠️ 无效的转录负载格式');
        return;
      }

      for (const notification of payload.value) {
        const { resource, changeType } = notification;
        
        this.logger.log(`🎙️ 转录事件: ${changeType} - ${resource}`);
        
        // Extract meeting ID and transcript ID from resource
        // Resource format: /communications/onlineMeetings/{meetingId}/transcripts/{transcriptId}
        const resourceMatch = resource.match(/\/communications\/onlineMeetings\/([^\/]+)\/transcripts\/([^\/]+)/);
        if (resourceMatch) {
          const [, meetingId, transcriptId] = resourceMatch;
          
          this.logger.log(`🎙️ 处理转录: meetingId=${meetingId}, transcriptId=${transcriptId}`);
          // TODO: Implement transcript processing
        }
      }
    } catch (error) {
      this.logger.error(`❌ 处理转录消息失败: ${error.message}`);
      throw error;
    }
  }
}