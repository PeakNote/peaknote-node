import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GraphUserSubscription } from '@/entities';

@Injectable()
export class GraphUserSubscriptionRepository {
  constructor(
    @InjectRepository(GraphUserSubscription)
    private readonly repository: Repository<GraphUserSubscription>,
  ) {}

  async save(subscription: GraphUserSubscription): Promise<GraphUserSubscription> {
    return this.repository.save(subscription);
  }

  async findOne(options: any): Promise<GraphUserSubscription | null> {
    return this.repository.findOne(options);
  }

  async find(): Promise<GraphUserSubscription[]> {
    return this.repository.find();
  }

  async findAll(): Promise<GraphUserSubscription[]> {
    return this.repository.find();
  }
}