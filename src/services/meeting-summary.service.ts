import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { AIConfig } from '@/config/ai.config';

@Injectable()
export class MeetingSummaryService {
  private readonly logger = new Logger(MeetingSummaryService.name);
  private readonly openai: OpenAI;

  constructor(private readonly aiConfig: AIConfig) {
    this.openai = new OpenAI({
      apiKey: this.aiConfig.apiKey,
      baseURL: this.aiConfig.baseURL,
    });
  }

  async generateSummary(transcriptContent: string): Promise<string> {
    try {
      this.logger.log('🤖 正在生成会议摘要...');

      const response = await this.openai.chat.completions.create({
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
      });

      const summary = response.choices[0]?.message?.content || '无法生成摘要';
      this.logger.log('✅ 会议摘要生成完成');
      
      return summary;
    } catch (error) {
      this.logger.error('❌ 生成会议摘要失败:', error.message);
      return `原始转录内容：\n${transcriptContent}`;
    }
  }
}