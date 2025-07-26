import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MeetingEvent, TranscriptStatus } from '@/entities';

@Injectable()
export class MeetingEventRepository {
  constructor(
    @InjectRepository(MeetingEvent)
    private readonly repository: Repository<MeetingEvent>,
  ) {}

  async findByStartTimeBetweenAndTranscriptStatus(
    start: Date,
    end: Date,
    transcriptStatus: TranscriptStatus,
  ): Promise<MeetingEvent[]> {
    return this.repository.find({
      where: {
        startTime: Between(start, end),
        transcriptStatus,
      },
    });
  }

  async findByMeetingIdAndTranscriptStatus(
    meetingId: string,
    transcriptStatus: TranscriptStatus,
  ): Promise<MeetingEvent | null> {
    return this.repository.findOne({
      where: {
        meetingId,
        transcriptStatus,
      },
    });
  }

  async findByEventId(eventId: string): Promise<MeetingEvent | null> {
    return this.repository.findOne({
      where: { eventId },
    });
  }

  async findEventIdsByJoinUrl(joinUrl: string): Promise<string[]> {
    const results = await this.repository
      .createQueryBuilder('m')
      .select('m.eventId')
      .where('m.joinUrl = :joinUrl', { joinUrl })
      .getMany();

    return results.map(result => result.eventId);
  }

  async save(meetingEvent: MeetingEvent): Promise<MeetingEvent> {
    return this.repository.save(meetingEvent);
  }

  async find(): Promise<MeetingEvent[]> {
    return this.repository.find();
  }

  async findOne(options: any): Promise<MeetingEvent | null> {
    return this.repository.findOne(options);
  }
}