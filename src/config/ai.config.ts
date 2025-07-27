import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIConfig {
  constructor(private readonly configService: ConfigService) {}

  get apiKey(): string {
    return this.configService.get<string>('AI_API_KEY') || this.configService.get<string>('OPENAI_API_KEY');
  }

  get baseURL(): string {
    return this.configService.get<string>('AI_BASE_URL') || this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
  }

  get model(): string {
    return this.configService.get<string>('AI_MODEL') || this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
  }

  get maxTokens(): number {
    return this.configService.get<number>('AI_MAX_TOKENS') || this.configService.get<number>('OPENAI_MAX_TOKENS') || 1000;
  }

  get temperature(): number {
    return this.configService.get<number>('AI_TEMPERATURE') || this.configService.get<number>('OPENAI_TEMPERATURE') || 0.3;
  }
}