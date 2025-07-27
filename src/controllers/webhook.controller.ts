import { Controller, Get, Post, Query, Body, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { GraphEventService } from '@/services/graph-event.service';
import { TranscriptService } from '@/services/transcript.service';
import { PayloadParserService } from '@/services/payload-parser.service';
import { SubscriptionService } from '@/services/subscription.service';
import { MessageProducer } from '@/services/message-producer.service';
import { GraphService } from '@/services/graph.service';

@Controller('webhook')
export class WebhookController {
  private recentWebhooks = new Set<string>(); // Simple deduplication

  constructor(
    private readonly graphEventService: GraphEventService,
    private readonly transcriptService: TranscriptService,
    private readonly payloadParserService: PayloadParserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly messageProducer: MessageProducer,
    private readonly graphService: GraphService,
  ) {
    // Clean up old webhook IDs every 5 minutes
    setInterval(() => {
      this.recentWebhooks.clear();
    }, 5 * 60 * 1000);
  }

  @Get('notification')
  validateGet(@Query('validationToken') token: string, @Res() res: Response) {
    console.log(`✅ 收到 Graph 验证 GET 请求，返回 token: ${token}`);
    return res.send(token);
  }

  @Post('notification')
  async handleNotification(@Req() req: Request, @Body() payload: string, @Res() res: Response) {
    const token = req.query.validationToken as string;
    
    if (token) {
      console.log(`✅ 收到 Graph 验证 POST 请求，返回 token: ${token}`);
      return res.send(token);
    }

    try {
      // Generate webhook signature for deduplication
      const webhookSignature = this.generateWebhookSignature(payload);
      
      if (this.recentWebhooks.has(webhookSignature)) {
        console.log(`⚠️ 忽略重复的 webhook: ${webhookSignature.substring(0, 8)}`);
        return res.send('DUPLICATE');
      }
      
      this.recentWebhooks.add(webhookSignature);
      console.log(`✅ 收到新的 webhook，开始处理: ${webhookSignature.substring(0, 8)}`);
      
      await this.messageProducer.sendEventMessage(payload);
      return res.send('OK');
    } catch (error) {
      console.error('❌ 处理事件 webhook 失败:', error.message);
      return res.status(400).send('Failed');
    }
  }

  private generateWebhookSignature(payload: any): string {
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const parsed = JSON.parse(payloadStr);
    
    // Create signature from subscription ID and resource for deduplication
    if (parsed.value && parsed.value.length > 0) {
      const notification = parsed.value[0];
      return `${notification.subscriptionId}-${notification.resource}-${notification.changeType}`;
    }
    
    return payloadStr.substring(0, 50); // Fallback
  }

  @Post('teams-transcript')
  async handleTeamsTranscript(@Req() req: Request, @Body() payload: string, @Res() res: Response) {
    const token = req.query.validationToken as string;
    
    if (token) {
      console.log(`✅ 收到 Graph 验证 POST 请求，返回 token: ${token}`);
      return res.send(token);
    }

    try {
      console.log('✅ 收到 transcript webhook，开始处理');
      await this.messageProducer.sendTranscriptMessage(payload);
      return res.send('OK');
    } catch (error) {
      console.error('❌ 处理 transcript webhook 失败:', error.message);
      return res.status(400).send('Failed');
    }
  }

  @Post('call-record')
  async handleCallRecord(@Req() req: Request, @Body() payload: string, @Res() res: Response) {
    const token = req.query.validationToken as string;
    
    if (token) {
      console.log(`✅ 收到 Graph 验证 POST 请求，返回 token: ${token}`);
      return res.send(token);
    }

    try {
      console.log('✅ 收到 call record webhook，开始处理');
      await this.messageProducer.sendCallRecordMessage(payload);
      return res.send('OK');
    } catch (error) {
      console.error('❌ 处理 call record webhook 失败:', error.message);
      return res.status(400).send('Failed');
    }
  }

  @Post('teams-lifecycle')
  async handleLifecycleNotification(@Req() req: Request, @Body() payload: string, @Res() res: Response) {
    const validationToken = req.query.validationToken as string;
    
    if (validationToken) {
      console.log(`✅ 收到 Graph 生命周期验证请求，返回 token: ${validationToken}`);
      return res.send(validationToken);
    }

    console.log(`✅ 收到 Graph 生命周期事件通知，内容: ${payload}`);
    // TODO: Parse lifecycle events and handle reauthorization/renewal
    
    return res.send('Received lifecycle event');
  }
}