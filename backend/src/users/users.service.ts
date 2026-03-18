import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Post } from '../database/entities/post.entity';
import { Comment } from '../database/entities/comment.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>): Promise<User> {
    if (userData.passwordHash) {
      userData.passwordHash = await bcrypt.hash(userData.passwordHash, 10);
    }
    const newUser = this.usersRepository.create(userData);
    return this.usersRepository.save(newUser);
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {
    await this.usersRepository.update(userId, updateData);
    const user = await this.findOneById(userId);
    if (!user) throw new NotFoundException('User not found after update');
    return user;
  }

  async getUserProfile(username: string) {
    const user = await this.findOneByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    
    const postCount = await this.dataSource.getRepository(Post).count({ where: { authorId: user.id } });
    const commentCount = await this.dataSource.getRepository(Comment).count({ where: { authorId: user.id } });

    const { passwordHash, ...safeUser } = user;
    return { ...safeUser, postCount, commentCount };
  }

  async getUserPosts(username: string, page: number = 1, limit: number = 20) {
    const user = await this.findOneByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    
    const [posts, total] = await this.dataSource.getRepository(Post).findAndCount({
      where: { authorId: user.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['community'],
    });
    
    return { data: posts, total, page, limit };
  }

  async getUserComments(username: string, page: number = 1, limit: number = 20) {
    const user = await this.findOneByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    
    const [comments, total] = await this.dataSource.getRepository(Comment).findAndCount({
      where: { authorId: user.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['post'],
    });
    
    return { data: comments, total, page, limit };
  }
}
