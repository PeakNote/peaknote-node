import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('graph_subscription')
export class GraphUserSubscription {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'datetime' })
  expirationDateTime: Date;
}