import { Injectable, Logger } from '@nestjs/common';
import { AIConfig } from '@/config/ai.config';

@Injectable()
export class MeetingSummaryService {
  private readonly logger = new Logger(MeetingSummaryService.name);

  constructor(private readonly aiConfig: AIConfig) {}

  async generateSummary(transcriptContent: string): Promise<string> {
    try {
      this.logger.log('🤖 正在生成会议摘要...');

      const payload = {
        model: this.aiConfig.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的会议摘要助手。请为提供的会议转录内容生成简洁的中文摘要，包括关键议题、决定和行动项。',
          },
          {
            role: 'user',
            content: `请为以下会议转录内容生成摘要：\n\n${transcriptContent}`,
          },
        ],
        max_tokens: this.aiConfig.maxTokens,
        temperature: this.aiConfig.temperature,
      };

      this.logger.log(`🔍 API请求: ${this.aiConfig.baseURL}/chat/completions`);
      this.logger.log(`🔍 模型: ${this.aiConfig.model}`);
      this.logger.log(`🔍 API密钥前缀: ${this.aiConfig.apiKey.substring(0, 10)}...`);

      const response = await fetch(`${this.aiConfig.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ API响应错误: ${response.status} - ${errorText}`);
        throw new Error(`${response.status} status code (${response.statusText})`);
      }

      const result = await response.json();
      
      // Handle both OpenAI and Meta Llama response formats
      const summary = result.choices?.[0]?.message?.content || 
                     result.completion_message?.content?.text || 
                     '无法生成摘要';
      
      this.logger.log('✅ 会议摘要生成完成');
      
      return summary;
    } catch (error) {
      this.logger.error('❌ 生成会议摘要失败:', error.message);
      return `原始转录内容：\n${transcriptContent}`;
    }
  }
}