import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { TranscriptController } from '@/controllers/transcript.controller';
import { WebhookController } from '@/controllers/webhook.controller';
import { MeetingSummaryService } from '@/services/meeting-summary.service';
import { GraphService } from '@/services/graph.service';
import { MessageProducer } from '@/services/message-producer.service';
import { MessageConsumer } from '@/services/message-consumer.service';
import { TranscriptService } from '@/services/transcript.service';
import { GraphEventService } from '@/services/graph-event.service';
import { PayloadParserService } from '@/services/payload-parser.service';
import { SubscriptionService } from '@/services/subscription.service';
import { AzureConfig } from '@/config/azure.config';
import { WebhookConfig } from '@/config/webhook.config';
import { AIConfig } from '@/config/ai.config';

// Simple transcript service without database dependencies
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
class SimpleTranscriptService {
  private readonly logger = new Logger(SimpleTranscriptService.name);

  async getEventIdsByUrl(url: string): Promise<string[]> {
    this.logger.log(`⚠️ Database not connected - returning empty for URL: ${url}`);
    return [];
  }

  async getTranscriptByEventId(eventId: string): Promise<string> {
    this.logger.log(`⚠️ Database not connected - returning empty for eventId: ${eventId}`);
    return '';
  }

  async updateTranscript(eventId: string, content: string): Promise<void> {
    this.logger.log(`⚠️ Database not connected - cannot update transcript for: ${eventId}`);
  }
}

@Injectable()
class SimpleGraphEventService {
  private readonly logger = new Logger(SimpleGraphEventService.name);

  async processEvent(userId: string, eventId: string, isRecurring: boolean): Promise<void> {
    this.logger.log(`⚠️ Database not connected - cannot process event: ${eventId}`);
  }
}

@Injectable()
class SimpleSubscriptionService {
  private readonly logger = new Logger(SimpleSubscriptionService.name);

  async createTranscriptSubscription(meetingId: string): Promise<void> {
    this.logger.log(`⚠️ GraphService not configured - cannot create subscription for: ${meetingId}`);
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        console.log('ℹ️ Using in-memory cache');
        return {
          ttl: 3600000, // 1 hour - in-memory cache
        };
      },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [TranscriptController, WebhookController],
  providers: [
    { provide: TranscriptService, useClass: SimpleTranscriptService },
    { provide: GraphEventService, useClass: SimpleGraphEventService },
    { provide: SubscriptionService, useClass: SimpleSubscriptionService },
    GraphService,
    MeetingSummaryService,
    PayloadParserService,
    MessageProducer,
    MessageConsumer,
    AzureConfig,
    WebhookConfig,
    AIConfig,
  ],
})
export class AppModule {}