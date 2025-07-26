import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { TeamsUser } from './teams-user.entity';

@Entity('meeting_url_access')
export class MeetingUrlAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TeamsUser, { eager: true })
  @JoinColumn({ name: 'owner_oid' })
  owner: TeamsUser;

  @ManyToOne(() => TeamsUser, { eager: true })
  @JoinColumn({ name: 'shared_with_oid' })
  sharedWith: TeamsUser;

  @Column()
  joinUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}