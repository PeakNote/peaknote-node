import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MessageProducer {
  private readonly logger = new Logger(MessageProducer.name);

  async sendEventMessage(message: string): Promise<void> {
    this.logger.log('📤 Event 消息待发送 (RabbitMQ 暂未配置)');
    // TODO: Implement RabbitMQ connection when needed
  }

  async sendTranscriptMessage(message: string): Promise<void> {
    this.logger.log('📤 Transcript 消息待发送 (RabbitMQ 暂未配置)');
    // TODO: Implement RabbitMQ connection when needed
  }
}