import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { MeetingEvent } from './meeting-event.entity';

@Entity('meeting_transcript')
export class MeetingTranscript {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MeetingEvent, { eager: true })
  @JoinColumn({ name: 'meeting_event_event_id' })
  meetingEvent: MeetingEvent;

  @Column('text')
  contentText: string;

  @Column({ nullable: true })
  downloadUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}