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
  constructor(
    private readonly graphEventService: GraphEventService,
    private readonly transcriptService: TranscriptService,
    private readonly payloadParserService: PayloadParserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly messageProducer: MessageProducer,
    private readonly graphService: GraphService,
  ) {}

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
      console.log('✅ 收到事件 webhook，开始处理');
      await this.messageProducer.sendEventMessage(payload);
      return res.send('OK');
    } catch (error) {
      console.error('❌ 处理事件 webhook 失败:', error.message);
      return res.status(400).send('Failed');
    }
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