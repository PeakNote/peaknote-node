import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AzureConfig {
  constructor(private readonly configService: ConfigService) {}

  get tenantId(): string {
    return this.configService.get<string>('AZURE_TENANT_ID');
  }

  get clientId(): string {
    return this.configService.get<string>('AZURE_CLIENT_ID');
  }

  get clientSecret(): string {
    return this.configService.get<string>('AZURE_CLIENT_SECRET');
  }

  get graphScope(): string {
    return this.configService.get<string>('AZURE_GRAPH_SCOPE', 'https://graph.microsoft.com/.default');
  }
}