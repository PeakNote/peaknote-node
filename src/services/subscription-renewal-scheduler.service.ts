import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GraphUserSubscription } from '@/entities';
import { GraphService } from './graph.service';

@Injectable()
export class SubscriptionRenewalScheduler {
  private readonly logger = new Logger(SubscriptionRenewalScheduler.name);

  constructor(
    @InjectRepository(GraphUserSubscription)
    private readonly subscriptionRepository: Repository<GraphUserSubscription>,
    private readonly graphService: GraphService,
  ) {}

  @Cron('0 0 2 * * *') // 每天凌晨2点执行
  async renewSubscriptions(): Promise<void> {
    try {
      const subscriptions = await this.subscriptionRepository.find();

      for (const sub of subscriptions) {
        // 检查距离过期时间是否小于25小时
        const expireTime = new Date(sub.expirationDateTime);
        const now = new Date();
        const hoursUntilExpire = (expireTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilExpire < 25) {
          try {
            // 续订逻辑
            const newExpire = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 续订3天
            await this.graphService.renewSubscription(sub.id, newExpire);
            
            // 更新数据库里的 expirationDateTime
            sub.expirationDateTime = newExpire;
            await this.subscriptionRepository.save(sub);
            
            this.logger.log(`✅ 成功续订订阅: ${sub.id}`);
          } catch (error) {
            this.logger.error(`❌ 续订订阅失败 ${sub.id}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      this.logger.error('❌ 续订订阅调度失败:', error.message);
    }
  }
}