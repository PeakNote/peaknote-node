import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TeamsUserSyncService } from './services/teams-user-sync.service';
import { SubscriptionService } from './services/subscription.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);
  
  console.log(`✅ PeakNote backend is running on port ${port}`);
  console.log(`🟡 正在同步用户并注册订阅...`);
  
  // Sync users and create subscriptions
  try {
    const userSyncService = app.get(TeamsUserSyncService);
    const subscriptionService = app.get(SubscriptionService);
    
    await userSyncService.syncUsers();
    await subscriptionService.createSubscriptionsForAllUsers();
    // TODO: Fix call record subscription - current implementation has wrong resource path
    // await subscriptionService.createCallRecordSubscription();
    
    console.log(`✅ 用户同步和订阅注册完成`);
  } catch (error) {
    console.error(`❌ 用户同步或订阅注册失败:`, error.message);
  }
}

bootstrap();