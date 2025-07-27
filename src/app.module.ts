import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { redisStore } from 'cache-manager-redis-yet';
import { 
  MeetingEvent, 
  MeetingTranscript, 
  MeetingInstance, 
  TeamsUser, 
  GraphUserSubscription, 
  MeetingUrlAccess 
} from '@/entities';
import { TranscriptController } from '@/controllers/transcript.controller';
import { WebhookController } from '@/controllers/webhook.controller';
import { TranscriptService } from '@/services/transcript.service';
import { GraphService } from '@/services/graph.service';
import { MeetingSummaryService } from '@/services/meeting-summary.service';
import { GraphEventService } from '@/services/graph-event.service';
import { PayloadParserService } from '@/services/payload-parser.service';
import { MessageProducer } from '@/services/message-producer.service';
import { MessageConsumer } from '@/services/message-consumer.service';
import { SubscriptionService } from '@/services/subscription.service';
import { MeetingEventSchedulerService } from '@/services/meeting-event-scheduler.service';
import { SubscriptionRenewalScheduler } from '@/services/subscription-renewal-scheduler.service';
import { CallRecordSyncScheduler } from '@/services/call-record-sync-scheduler.service';
import { TeamsUserSyncService } from '@/services/teams-user-sync.service';
import { MeetingInstanceSyncService } from '@/services/meeting-instance-sync.service';
import { AzureConfig } from '@/config/azure.config';
import { WebhookConfig } from '@/config/webhook.config';
import { AIConfig } from '@/config/ai.config';
import {
  MeetingEventRepository,
  MeetingTranscriptRepository,
  GraphUserSubscriptionRepository,
  UserRepository,
  MeetingInstanceRepository,
} from '@/repositories';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        const dbConfig = {
          type: 'mysql' as const,
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 3306,
          username: process.env.DB_USERNAME || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_DATABASE || 'peaknote',
          entities: [
            MeetingEvent,
            MeetingTranscript,
            MeetingInstance,
            TeamsUser,
            GraphUserSubscription,
            MeetingUrlAccess,
          ],
          synchronize: process.env.NODE_ENV !== 'production',
          logging: process.env.NODE_ENV === 'development',
          autoLoadEntities: true,
        };

        // Test database connection
        try {
          const mysql = require('mysql2/promise');
          const connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.username,
            password: dbConfig.password,
            connectTimeout: 2000,
          });
          await connection.end();
          console.log('✅ MySQL connection successful');
          return dbConfig;
        } catch (error) {
          console.warn('⚠️ MySQL not available, using SQLite fallback:', error.message);
          return {
            type: 'sqlite' as const,
            database: ':memory:',
            entities: dbConfig.entities,
            synchronize: true,
            logging: false,
            autoLoadEntities: true,
          };
        }
      },
    }),
    TypeOrmModule.forFeature([
      MeetingEvent,
      MeetingTranscript,
      MeetingInstance,
      TeamsUser,
      GraphUserSubscription,
      MeetingUrlAccess,
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        // Always use in-memory cache for simplicity in development
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
    TranscriptService,
    GraphService,
    MeetingSummaryService,
    GraphEventService,
    PayloadParserService,
    MessageProducer,
    MessageConsumer,
    SubscriptionService,
    MeetingEventSchedulerService,
    SubscriptionRenewalScheduler,
    CallRecordSyncScheduler,
    TeamsUserSyncService,
    MeetingInstanceSyncService,
    AzureConfig,
    WebhookConfig,
    AIConfig,
    MeetingEventRepository,
    MeetingTranscriptRepository,
    GraphUserSubscriptionRepository,
    UserRepository,
    MeetingInstanceRepository,
  ],
})
export class AppModule {}