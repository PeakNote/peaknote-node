import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookConfig {
  constructor(private readonly configService: ConfigService) {}

  get baseUrl(): string {
    return this.configService.get<string>('WEBHOOK_BASE_URL');
  }

  get tenantId(): string {
    return this.configService.get<string>('WEBHOOK_TENANT_ID');
  }

  get clientId(): string {
    return this.configService.get<string>('WEBHOOK_CLIENT_ID');
  }

  get clientSecret(): string {
    return this.configService.get<string>('WEBHOOK_CLIENT_SECRET');
  }
}