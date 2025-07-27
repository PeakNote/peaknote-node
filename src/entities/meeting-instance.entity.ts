import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

export enum TranscriptStatus {
  NONE = 'none',
  SUBSCRIBED = 'subscribed',
  SAVED = 'saved',
  PROCESSING = 'processing',
  AVAILABLE = 'available',
  FAILED = 'failed'
}

@Entity('meeting_instance')
export class MeetingInstance {
  @PrimaryColumn({ name: 'event_id' })
  eventId: string;

  @Column()
  seriesMasterId: string;

  @Column()
  joinUrl: string;

  @Column({ nullable: true })
  callRecordId: string;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: TranscriptStatus.NONE
  })
  transcriptStatus: TranscriptStatus;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}