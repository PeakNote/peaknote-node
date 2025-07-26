import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamsUser } from '@/entities';
import { GraphService } from './graph.service';

@Injectable()
export class TeamsUserSyncService {
  private readonly logger = new Logger(TeamsUserSyncService.name);

  constructor(
    @InjectRepository(TeamsUser)
    private readonly userRepository: Repository<TeamsUser>,
    private readonly graphService: GraphService,
  ) {}

  async syncUsers(): Promise<void> {
    try {
      const graphUsers = await this.graphService.fetchAllUsers();

      for (const gUser of graphUsers) {
        if (!gUser.id || (!gUser.mail && !gUser.userPrincipalName)) {
          continue;
        }

        // Check if user already exists
        let user = await this.userRepository.findOne({ where: { oid: gUser.id } });
        
        if (!user) {
          user = new TeamsUser();
          user.oid = gUser.id;
        }
        
        user.email = gUser.mail || gUser.userPrincipalName;
        
        await this.userRepository.save(user); // insert or update
        this.logger.log(`✅ 同步用户: ${user.oid} - ${user.email}`);
      }

      this.logger.log(`✅ 用户同步完成，共处理 ${graphUsers.length} 个用户`);
    } catch (error) {
      this.logger.error('❌ 用户同步失败:', error.message);
      throw error;
    }
  }
}