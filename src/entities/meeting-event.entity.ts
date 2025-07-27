import { Entity, PrimaryColumn, Column } from 'typeorm';
import { TranscriptStatus } from './meeting-instance.entity';

@Entity('meeting_event')
export class MeetingEvent {
  @PrimaryColumn()
  eventId: string;

  @Column({ name: 'series_master_id', nullable: true })
  seriesMasterId: string;

  @Column()
  userId: string;

  @Column()
  subject: string;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column()
  joinUrl: string;

  @Column()
  meetingId: string;

  @Column({ type: 'datetime', nullable: true })
  lastNotifiedAt: Date;

  @Column({
    name: 'transcript_status',
    type: 'varchar',
    length: 50,
    default: TranscriptStatus.NONE
  })
  transcriptStatus: TranscriptStatus;
}