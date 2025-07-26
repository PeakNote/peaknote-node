import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { 
  MeetingEvent, 
  MeetingTranscript, 
  MeetingInstance, 
  TeamsUser, 
  GraphUserSubscription, 
  MeetingUrlAccess 
} from '@/entities';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async (configService: ConfigService) => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'peaknote'),
        entities: [
          MeetingEvent,
          MeetingTranscript,
          MeetingInstance,
          TeamsUser,
          GraphUserSubscription,
          MeetingUrlAccess,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      });

      return dataSource.initialize();
    },
    inject: [ConfigService],
  },
];