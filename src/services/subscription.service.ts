import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GraphUserSubscription, TeamsUser } from '@/entities';
import { GraphService } from './graph.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(GraphUserSubscription)
    private readonly graphUserSubscriptionRepository: Repository<GraphUserSubscription>,
    @InjectRepository(TeamsUser)
    private readonly teamsUserRepository: Repository<TeamsUser>,
    private readonly graphService: GraphService,
    private readonly configService: ConfigService,
  ) {}

  async createSubscriptionsForAllUsers(): Promise<void> {
    try {
      const users = await this.teamsUserRepository.find();
      
      for (const user of users) {
        await this.createEventSubscription(user.oid);
      }
    } catch (error) {
      this.logger.error(`❌ 创建订阅失败: ${error.message}`);
      throw error;
    }
  }

  async createEventSubscription(userId: string): Promise<void> {
    try {
      const notificationUrl = `${this.configService.get('WEBHOOK_BASE_URL')}/webhook/notification`;
      const expireTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      const clientState = 'yourCustomState';

      const created = await this.graphService.createEventSubscription(
        userId,
        notificationUrl,
        clientState,
        expireTime,
      );

      this.logger.log(`✅ 成功为用户 ${userId} 创建订阅: ${created.id}`);

      // 存进数据库
      const graphUserSubscription = new GraphUserSubscription();
      graphUserSubscription.id = created.id;
      graphUserSubscription.expirationDateTime = expireTime;
      await this.graphUserSubscriptionRepository.save(graphUserSubscription);
    } catch (error) {
      this.logger.error(`❌ 用户 ${userId} 创建订阅失败: ${error.message}`);
      throw error;
    }
  }

  async listAndDeleteAllSubscriptions(): Promise<void> {
    try {
      const subscriptions = await this.graphService.listAllSubscriptions();

      if (!subscriptions.value || subscriptions.value.length === 0) {
        this.logger.log('✅ 当前没有任何订阅');
        return;
      }

      for (const sub of subscriptions.value) {
        this.logger.log(
          `➡️ 准备删除订阅: ID=${sub.id}, Resource=${sub.resource}, Expires=${sub.expirationDateTime}`,
        );

        await this.graphService.deleteSubscription(sub.id);
        this.logger.log(`🗑️ 已删除订阅: ${sub.id}`);
      }

      this.logger.log('✅ 所有订阅已删除完成');
    } catch (error) {
      this.logger.error(`❌ 删除订阅时出错: ${error.message}`);
      throw error;
    }
  }

  async listAllSubscriptions(): Promise<void> {
    try {
      const subscriptions = await this.graphService.listAllSubscriptions();

      if (!subscriptions.value || subscriptions.value.length === 0) {
        this.logger.log('✅ 当前没有任何订阅');
        return;
      }

      for (const sub of subscriptions.value) {
        this.logger.log(
          `🔎 订阅信息: ID=${sub.id}, Resource=${sub.resource}, Expires=${sub.expirationDateTime}`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ 获取订阅列表失败: ${error.message}`);
      throw error;
    }
  }

  async createTranscriptSubscription(meetingId: string): Promise<void> {
    try {
      const expireTime = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
      const clientState = uuidv4();
      const notificationUrl = `${this.configService.get('WEBHOOK_BASE_URL')}/webhook/teams-transcript`;

      const created = await this.graphService.createTranscriptSubscription(
        meetingId,
        notificationUrl,
        clientState,
        expireTime,
      );

      this.logger.log(`✅ 为会议 ${meetingId} 创建 transcript 订阅成功，订阅 ID: ${created.id}`);
    } catch (error) {
      this.logger.error(`❌ 会议 ${meetingId} 创建 transcript 订阅失败: ${error.message}`);
      throw error;
    }
  }
}