import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);
  private readonly graphClient: Client;
  private readonly webhookGraphClient: Client;
  private readonly credential: ClientSecretCredential;

  constructor(private readonly configService: ConfigService) {
    const tenantId = this.configService.get('AZURE_TENANT_ID');
    const clientId = this.configService.get('AZURE_CLIENT_ID');
    const clientSecret = this.configService.get('AZURE_CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) {
      this.logger.warn('⚠️ Azure credentials not configured - GraphService will be disabled');
      return;
    }

    try {
      this.credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

      const authProvider = new TokenCredentialAuthenticationProvider(this.credential, {
        scopes: ['https://graph.microsoft.com/.default'],
      });

      this.graphClient = Client.initWithMiddleware({ authProvider });
      this.webhookGraphClient = Client.initWithMiddleware({ authProvider });
      
      this.logger.log('✅ GraphService initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize GraphService:', error.message);
    }
  }

  private isReady(): boolean {
    return !!(this.graphClient && this.webhookGraphClient && this.credential);
  }

  async fetchAllUsers(): Promise<any[]> {
    if (!this.isReady()) {
      this.logger.warn('⚠️ GraphService not initialized - returning empty user list');
      return [];
    }

    try {
      const result = [];
      let users = await this.graphClient
        .api('/users')
        .select('id,mail,userPrincipalName')
        .top(50)
        .get();

      while (users.value && users.value.length > 0) {
        result.push(...users.value);
        if (users['@odata.nextLink']) {
          users = await this.graphClient.api(users['@odata.nextLink']).get();
        } else {
          break;
        }
      }

      this.logger.log(`✅ 获取到 ${result.length} 个用户`);
      return result;
    } catch (error) {
      this.logger.error('❌ 获取用户失败:', error.message);
      return [];
    }
  }

  async getUserEvent(userId: string, eventId: string): Promise<any> {
    if (!this.isReady()) {
      this.logger.warn('⚠️ GraphService not initialized');
      return null;
    }

    try {
      const event = await this.webhookGraphClient
        .api(`/users/${userId}/events/${eventId}`)
        .get();
      
      this.logger.log(`✅ 获取用户事件成功: ${eventId}`);
      return event;
    } catch (error) {
      this.logger.error(`❌ 获取用户事件失败: ${error.message}`);
      return null;
    }
  }

  async getOnlineMeetingsByJoinUrl(userId: string, joinUrl: string): Promise<any> {
    if (!this.isReady()) {
      this.logger.warn('⚠️ GraphService not initialized');
      return { value: [] };
    }

    try {
      const meetings = await this.graphClient
        .api(`/users/${userId}/onlineMeetings`)
        .filter(`JoinWebUrl eq '${joinUrl}'`)
        .get();

      this.logger.log(`✅ 根据JoinUrl查询到在线会议`);
      return meetings;
    } catch (error) {
      this.logger.error(`❌ 根据JoinUrl查询在线会议失败: ${error.message}`);
      return { value: [] };
    }
  }

  async getEventOccurrences(
    userId: string, 
    seriesMasterId: string, 
    startDateTime: string, 
    endDateTime: string
  ): Promise<any> {
    try {
      const occurrences = await this.webhookGraphClient
        .api(`/users/${userId}/events/${seriesMasterId}/instances`)
        .query({
          startDateTime,
          endDateTime,
        })
        .get();

      this.logger.log(`✅ 获取系列会议实例成功`);
      return occurrences;
    } catch (error) {
      this.logger.error(`❌ 获取系列会议实例失败: ${error.message}`);
      throw error;
    }
  }

  async createEventSubscription(
    userId: string,
    notificationUrl: string,
    clientState: string,
    expireTime: Date,
  ): Promise<any> {
    try {
      const subscription = {
        changeType: 'created',
        notificationUrl,
        resource: `/users/${userId}/events`,
        expirationDateTime: expireTime.toISOString(),
        clientState,
      };

      const result = await this.webhookGraphClient
        .api('/subscriptions')
        .post(subscription);

      this.logger.log(`✅ 创建事件订阅成功: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ 创建事件订阅失败: ${error.message}`);
      throw error;
    }
  }

  async createCallRecordSubscription(
    notificationUrl: string,
    clientState: string,
    expireTime: Date,
  ): Promise<any> {
    try {
      const subscription = {
        changeType: 'created,updated',
        notificationUrl,
        resource: '/communications/onlineMeetings',
        expirationDateTime: expireTime.toISOString(),
        clientState,
      };

      const result = await this.webhookGraphClient
        .api('/subscriptions')
        .post(subscription);

      this.logger.log(`✅ 创建通话记录订阅成功: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ 创建通话记录订阅失败: ${error.message}`);
      throw error;
    }
  }

  async createTranscriptSubscription(
    meetingId: string,
    notificationUrl: string,
    clientState: string,
    expireTime: Date,
  ): Promise<any> {
    try {
      const subscription = {
        changeType: 'created',
        notificationUrl,
        resource: `/communications/onlineMeetings/${meetingId}/transcripts`,
        expirationDateTime: expireTime.toISOString(),
        clientState,
        lifecycleNotificationUrl: `${this.configService.get('WEBHOOK_BASE_URL')}/webhook/teams-lifecycle`,
      };

      const result = await this.webhookGraphClient
        .api('/subscriptions')
        .post(subscription);

      this.logger.log(`✅ 创建转录订阅成功: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ 创建转录订阅失败: ${error.message}`);
      throw error;
    }
  }

  async listAllSubscriptions(): Promise<any> {
    try {
      const subscriptions = await this.webhookGraphClient
        .api('/subscriptions')
        .get();

      this.logger.log(`✅ 获取订阅列表成功，共 ${subscriptions.value?.length || 0} 个订阅`);
      return subscriptions;
    } catch (error) {
      this.logger.error(`❌ 获取订阅列表失败: ${error.message}`);
      throw error;
    }
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.webhookGraphClient
        .api(`/subscriptions/${subscriptionId}`)
        .delete();

      this.logger.log(`✅ 删除订阅成功: ${subscriptionId}`);
    } catch (error) {
      this.logger.error(`❌ 删除订阅失败: ${error.message}`);
      throw error;
    }
  }

  async renewSubscription(subscriptionId: string, newExpiration: Date): Promise<any> {
    try {
      const subscription = {
        expirationDateTime: newExpiration.toISOString(),
      };

      const result = await this.graphClient
        .api(`/subscriptions/${subscriptionId}`)
        .patch(subscription);

      this.logger.log(`✅ 续订订阅成功: ${subscriptionId}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ 续订订阅失败: ${error.message}`);
      throw error;
    }
  }

  async getAccessToken(): Promise<string> {
    if (!this.isReady()) {
      this.logger.warn('⚠️ GraphService not initialized - cannot get access token');
      return '';
    }

    try {
      const tokenResponse = await this.credential.getToken([
        'https://graph.microsoft.com/.default',
      ]);
      
      return tokenResponse.token;
    } catch (error) {
      this.logger.error('❌ 获取访问令牌失败:', error.message);
      return '';
    }
  }
}