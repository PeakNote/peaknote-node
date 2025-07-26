import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingInstance } from '@/entities';

@Injectable()
export class MeetingInstanceRepository {
  constructor(
    @InjectRepository(MeetingInstance)
    private readonly repository: Repository<MeetingInstance>,
  ) {}

  async save(meetingInstance: MeetingInstance): Promise<MeetingInstance> {
    return this.repository.save(meetingInstance);
  }

  async findOne(options: any): Promise<MeetingInstance | null> {
    return this.repository.findOne(options);
  }

  async find(): Promise<MeetingInstance[]> {
    return this.repository.find();
  }

  async existsById(eventId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { eventId } });
    return count > 0;
  }
}