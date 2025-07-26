import { Injectable, Logger } from '@nestjs/common';
import { TranscriptInfo } from '@/models/transcript-info.model';

@Injectable()
export class PayloadParserService {
  private readonly logger = new Logger(PayloadParserService.name);

  parseTranscriptInfo(payload: string): TranscriptInfo {
    try {
      const data = JSON.parse(payload);
      const valueNode = data.value[0];
      const resource = valueNode.resource;

      // resource 示例：users('userId')/onlineMeetings('meetingId')/transcripts('transcriptId')
      const cleaned = resource
        .replace("users('", "")
        .replace("')/onlineMeetings('", ",")
        .replace("')/transcripts('", ",")
        .replace("')", "");

      const parts = cleaned.split(",");

      if (parts.length === 3) {
        const userId = parts[0];
        const meetingId = parts[1];
        const transcriptId = parts[2];
        
        this.logger.log(`✅ 成功解析 transcript payload，userId=${userId}, meetingId=${meetingId}, transcriptId=${transcriptId}`);
        return new TranscriptInfo(userId, meetingId, transcriptId);
      } else {
        this.logger.error(`❌ 无法解析 transcript resource 格式，原始 resource: ${resource}`);
        throw new Error(`Invalid transcript resource format: ${resource}`);
      }
    } catch (error) {
      this.logger.error('❌ 解析 transcript payload 失败:', error.message);
      throw error;
    }
  }

  extractUserIdFromEventPayload(payload: string): string {
    try {
      const data = JSON.parse(payload);
      const valueNode = data.value[0];
      const resource = valueNode.resource;

      // 示例 resource: Users/{userId}/Events/{eventId}
      const parts = resource.split("/");
      if (parts.length >= 2) {
        const userId = parts[1];
        this.logger.log(`✅ 成功解析 event payload，userId=${userId}`);
        return userId;
      } else {
        this.logger.error(`❌ 无法解析事件 resource 格式，原始 resource: ${resource}`);
        throw new Error(`Invalid event resource format: ${resource}`);
      }
    } catch (error) {
      this.logger.error('❌ 解析事件用户ID失败:', error.message);
      throw error;
    }
  }

  extractEventIdFromEventPayload(payload: string): string {
    try {
      const data = JSON.parse(payload);
      const valueNode = data.value[0];
      const resourceData = valueNode.resourceData;

      if (resourceData && resourceData.id) {
        const eventId = resourceData.id;
        this.logger.log(`✅ 成功解析 event payload，eventId=${eventId}`);
        return eventId;
      } else {
        this.logger.error('❌ 无法在 resourceData 中找到 id 字段');
        throw new Error('Event payload missing id in resourceData');
      }
    } catch (error) {
      this.logger.error('❌ 解析事件ID失败:', error.message);
      throw error;
    }
  }

  extractSubscriptionId(payload: string): string | null {
    try {
      const data = JSON.parse(payload);
      const valueNode = data.value[0];

      if (valueNode.subscriptionId) {
        return valueNode.subscriptionId;
      } else {
        this.logger.warn('⚠️ webhook payload 不包含 subscriptionId');
        return null;
      }
    } catch (error) {
      this.logger.error('❌ 解析订阅ID失败:', error.message);
      throw error;
    }
  }

  extractChangeType(payload: string): string | null {
    try {
      const data = JSON.parse(payload);
      const valueArray = data.value;
      
      if (valueArray && Array.isArray(valueArray) && valueArray.length > 0) {
        const first = valueArray[0];
        return first.changeType;
      }
    } catch (error) {
      this.logger.error('❌ 解析 changeType 失败:', error.message);
      throw new Error('解析 changeType 失败');
    }
    return null;
  }
}