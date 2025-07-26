import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { TranscriptService } from '@/services/transcript.service';

@Controller('transcript')
export class TranscriptController {
  constructor(private readonly transcriptService: TranscriptService) {}

  @Get('by-url')
  async getTranscriptsByUrl(@Query('url') url: string) {
    const eventIds = await this.transcriptService.getEventIdsByUrl(url);
    
    if (!eventIds || eventIds.length === 0) {
      return { transcript: '' };
    }
    
    const transcript = await this.transcriptService.getTranscriptByEventId(eventIds[0]);
    return { transcript: transcript || '' };
  }

  @Post('update')
  async updateTranscript(
    @Query('eventId') eventId: string,
    @Query('content') content: string,
  ) {
    await this.transcriptService.updateTranscript(eventId, content);
    return '✅ success';
  }
}