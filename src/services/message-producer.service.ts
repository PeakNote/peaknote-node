import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class MessageProducer {
  private readonly logger = new Logger(MessageProducer.name);
  private connection: any = null;
  private channel: any = null;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
      this.logger.log(`🐰 尝试连接 RabbitMQ: ${rabbitmqUrl}`);
      
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      // Declare queues
      await this.channel.assertQueue('event-queue', { durable: true });
      await this.channel.assertQueue('transcript-queue', { durable: true });
      await this.channel.assertQueue('call-record-queue', { durable: true });
      
      this.logger.log('✅ RabbitMQ 连接成功');
    } catch (error) {
      this.logger.warn(`⚠️ RabbitMQ 连接失败，使用占位符模式: ${error.message}`);
    }
  }

  async sendEventMessage(message: any): Promise<void> {
    if (!this.channel) {
      this.logger.log('📤 Event 消息待发送 (RabbitMQ 暂未配置)');
      return;
    }

    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      await this.channel.sendToQueue('event-queue', Buffer.from(messageString), { persistent: true });
      this.logger.log('📤 Event 消息已发送到队列');
    } catch (error) {
      this.logger.error(`❌ Event 消息发送失败: ${error.message}`);
    }
  }

  async sendTranscriptMessage(message: any): Promise<void> {
    if (!this.channel) {
      this.logger.log('📤 Transcript 消息待发送 (RabbitMQ 暂未配置)');
      return;
    }

    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      await this.channel.sendToQueue('transcript-queue', Buffer.from(messageString), { persistent: true });
      this.logger.log('📤 Transcript 消息已发送到队列');
    } catch (error) {
      this.logger.error(`❌ Transcript 消息发送失败: ${error.message}`);
    }
  }

  async sendCallRecordMessage(message: any): Promise<void> {
    if (!this.channel) {
      this.logger.log('📤 CallRecord 消息待发送 (RabbitMQ 暂未配置)');
      return;
    }

    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      await this.channel.sendToQueue('call-record-queue', Buffer.from(messageString), { persistent: true });
      this.logger.log('📤 CallRecord 消息已发送到队列');
    } catch (error) {
      this.logger.error(`❌ CallRecord 消息发送失败: ${error.message}`);
    }
  }
}