import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingTranscript } from '@/entities';

@Injectable()
export class MeetingTranscriptRepository {
  constructor(
    @InjectRepository(MeetingTranscript)
    private readonly repository: Repository<MeetingTranscript>,
  ) {}

  async save(meetingTranscript: MeetingTranscript): Promise<MeetingTranscript> {
    return this.repository.save(meetingTranscript);
  }

  async findOne(options: any): Promise<MeetingTranscript | null> {
    return this.repository.findOne(options);
  }

  async find(): Promise<MeetingTranscript[]> {
    return this.repository.find();
  }

  createQueryBuilder(alias?: string) {
    return this.repository.createQueryBuilder(alias);
  }
}