import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../database/entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(userId: string, type: NotificationType, payload: Record<string, any>) {
    const notification = new Notification();
    Object.assign(notification, { userId, type, payload });
    return this.notificationsRepository.save(notification);
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const [notifications, total] = await this.notificationsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: notifications, total, page, limit };
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepository.update({ userId, isRead: false }, { isRead: true });
    return { message: 'All notifications marked as read' };
  }
}
