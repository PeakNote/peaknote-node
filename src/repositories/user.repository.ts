import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamsUser } from '@/entities';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(TeamsUser)
    private readonly repository: Repository<TeamsUser>,
  ) {}

  async save(user: TeamsUser): Promise<TeamsUser> {
    return this.repository.save(user);
  }

  async findOne(options: any): Promise<TeamsUser | null> {
    return this.repository.findOne(options);
  }

  async find(): Promise<TeamsUser[]> {
    return this.repository.find();
  }

  async findAll(): Promise<TeamsUser[]> {
    return this.repository.find();
  }
}