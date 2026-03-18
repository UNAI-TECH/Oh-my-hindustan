import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../database/entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private messagesRepository: Repository<Message>,
  ) {}

  async sendMessage(senderId: string, receiverId: string, body: string) {
    const message = new Message();
    Object.assign(message, { senderId, receiverId, body });
    return this.messagesRepository.save(message);
  }

  async getConversations(userId: string) {
    // Get distinct conversation partners
    const conversations = await this.messagesRepository.query(`
      SELECT DISTINCT ON (partner_id) partner_id, body, created_at FROM (
        SELECT receiver_id AS partner_id, body, created_at FROM messages WHERE sender_id = $1
        UNION ALL
        SELECT sender_id AS partner_id, body, created_at FROM messages WHERE receiver_id = $1
      ) sub ORDER BY partner_id, created_at DESC
    `, [userId]);
    return conversations;
  }

  async getThread(userId: string, partnerId: string, page: number = 1, limit: number = 50) {
    const [messages, total] = await this.messagesRepository.findAndCount({
      where: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: messages, total, page, limit };
  }
}
