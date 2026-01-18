import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    type: NotificationType,
    titleKey: string,
    bodyKey: string,
    data?: Record<string, unknown>,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        titleKey,
        bodyKey,
        data: data ?? undefined,
      },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async sendDrinkPassIssued(userId: string, drinkName: string, expiresAt: Date) {
    return this.create(
      userId,
      NotificationType.DRINK_PASS_ISSUED,
      'notifications.drinkPassIssued.title',
      'notifications.drinkPassIssued.body',
      { drinkName, expiresAt: expiresAt.toISOString() },
    );
  }

  async sendDrinkPassExpiring(userId: string, drinkName: string, expiresAt: Date) {
    return this.create(
      userId,
      NotificationType.DRINK_PASS_EXPIRING,
      'notifications.drinkPassExpiring.title',
      'notifications.drinkPassExpiring.body',
      { drinkName, expiresAt: expiresAt.toISOString() },
    );
  }

  async sendQuestCompleted(userId: string, questName: string) {
    return this.create(
      userId,
      NotificationType.QUEST_COMPLETED,
      'notifications.questCompleted.title',
      'notifications.questCompleted.body',
      { questName },
    );
  }
}
