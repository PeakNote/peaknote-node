import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MessageConsumer {
  private readonly logger = new Logger(MessageConsumer.name);

  constructor() {
    this.logger.log('📥 MessageConsumer 初始化 (RabbitMQ 暂未配置)');
    // TODO: Implement RabbitMQ connection when needed
  }
}