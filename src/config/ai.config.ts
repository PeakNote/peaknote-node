import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIConfig {
  constructor(private readonly configService: ConfigService) {}

  get openaiApiKey(): string {
    return this.configService.get<string>('OPENAI_API_KEY');
  }

  get model(): string {
    return this.configService.get<string>('OPENAI_MODEL', 'gpt-3.5-turbo');
  }

  get maxTokens(): number {
    return this.configService.get<number>('OPENAI_MAX_TOKENS', 1000);
  }

  get temperature(): number {
    return this.configService.get<number>('OPENAI_TEMPERATURE', 0.3);
  }
}