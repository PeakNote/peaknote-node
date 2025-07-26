import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('users')
export class TeamsUser {
  @PrimaryColumn({ name: 'oid' })
  oid: string;

  @Column({ unique: true })
  email: string;
}