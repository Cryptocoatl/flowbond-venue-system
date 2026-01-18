import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DrinkPassStatus, QuestStatus, NotificationType } from '@prisma/client';
import { generateSecureCode } from '../../config/security.config';

@Injectable()
export class RewardsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async claimReward(userId: string, questId: string, venueId: string) {
    // Verify quest is completed
    const progress = await this.prisma.questProgress.findUnique({
      where: {
        questId_userId: {
          questId,
          userId,
        },
      },
      include: {
        quest: {
          include: {
            drinkReward: true,
          },
        },
      },
    });

    if (!progress) {
      throw new NotFoundException('Quest progress not found');
    }

    if (progress.status !== QuestStatus.COMPLETED) {
      throw new BadRequestException('Quest not completed');
    }

    const reward = progress.quest.drinkReward;
    if (!reward) {
      throw new NotFoundException('No drink reward for this quest');
    }

    // Check if user already has an active pass for this reward
    const existingPass = await this.prisma.drinkPass.findFirst({
      where: {
        userId,
        rewardId: reward.id,
        status: DrinkPassStatus.ACTIVE,
      },
    });

    if (existingPass) {
      throw new ConflictException('You already have an active drink pass for this reward');
    }

    // Check max redemptions
    if (reward.maxRedemptions && reward.redemptionCount >= reward.maxRedemptions) {
      throw new BadRequestException('This reward has reached maximum redemptions');
    }

    // Create drink pass
    const code = generateSecureCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + reward.validityHours);

    const drinkPass = await this.prisma.drinkPass.create({
      data: {
        code,
        rewardId: reward.id,
        userId,
        venueId,
        expiresAt,
      },
      include: {
        reward: true,
        venue: true,
      },
    });

    // Increment redemption count
    await this.prisma.drinkReward.update({
      where: { id: reward.id },
      data: { redemptionCount: { increment: 1 } },
    });

    // Send notification
    await this.notifications.create({
      userId,
      type: NotificationType.DRINK_PASS_ISSUED,
      titleKey: 'notification.drinkPassIssued',
      bodyKey: 'notification.drinkPassIssuedBody',
      data: {
        drink: reward.name,
        expiry: expiresAt.toISOString(),
        passCode: code,
      },
    });

    return drinkPass;
  }

  async getUserPasses(userId: string) {
    return this.prisma.drinkPass.findMany({
      where: { userId },
      include: {
        reward: true,
        venue: true,
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getActivePass(passId: string) {
    const pass = await this.prisma.drinkPass.findUnique({
      where: { id: passId },
      include: {
        reward: {
          include: {
            sponsor: true,
          },
        },
        venue: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!pass) {
      throw new NotFoundException('Drink pass not found');
    }

    return pass;
  }

  async getPassByCode(code: string) {
    const pass = await this.prisma.drinkPass.findUnique({
      where: { code },
      include: {
        reward: {
          include: {
            sponsor: true,
          },
        },
        venue: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!pass) {
      throw new NotFoundException('Drink pass not found');
    }

    return pass;
  }

  async redeemPass(passId: string, staffUserId: string) {
    const pass = await this.prisma.drinkPass.findUnique({
      where: { id: passId },
      include: {
        reward: true,
        user: true,
      },
    });

    if (!pass) {
      throw new NotFoundException('Drink pass not found');
    }

    if (pass.status === DrinkPassStatus.REDEEMED) {
      throw new ConflictException('Drink pass already redeemed');
    }

    if (pass.status === DrinkPassStatus.EXPIRED || pass.expiresAt < new Date()) {
      // Mark as expired if not already
      if (pass.status !== DrinkPassStatus.EXPIRED) {
        await this.prisma.drinkPass.update({
          where: { id: passId },
          data: { status: DrinkPassStatus.EXPIRED },
        });
      }
      throw new BadRequestException('Drink pass has expired');
    }

    if (pass.status === DrinkPassStatus.CANCELLED) {
      throw new BadRequestException('Drink pass has been cancelled');
    }

    // Verify staff user
    const staff = await this.prisma.user.findUnique({
      where: { id: staffUserId },
    });

    if (!staff?.isStaff && !staff?.isAdmin) {
      throw new ForbiddenException('Only staff can redeem drink passes');
    }

    // Redeem the pass
    const redeemedPass = await this.prisma.drinkPass.update({
      where: { id: passId },
      data: {
        status: DrinkPassStatus.REDEEMED,
        redeemedAt: new Date(),
        redeemedBy: staffUserId,
      },
      include: {
        reward: true,
        venue: true,
      },
    });

    // Send notification to user
    await this.notifications.create({
      userId: pass.userId,
      type: NotificationType.DRINK_PASS_REDEEMED,
      titleKey: 'notification.drinkPassRedeemed',
      bodyKey: 'notification.drinkPassRedeemedBody',
      data: {
        drink: pass.reward.name,
      },
    });

    return redeemedPass;
  }

  async verifyPass(code: string) {
    const pass = await this.getPassByCode(code);

    const isValid =
      pass.status === DrinkPassStatus.ACTIVE && pass.expiresAt > new Date();

    return {
      isValid,
      pass,
      reason: !isValid
        ? pass.status === DrinkPassStatus.REDEEMED
          ? 'Already redeemed'
          : pass.status === DrinkPassStatus.EXPIRED || pass.expiresAt < new Date()
          ? 'Expired'
          : pass.status === DrinkPassStatus.CANCELLED
          ? 'Cancelled'
          : 'Invalid'
        : null,
    };
  }

  async cancelPass(passId: string, userId: string) {
    const pass = await this.prisma.drinkPass.findUnique({
      where: { id: passId },
    });

    if (!pass) {
      throw new NotFoundException('Drink pass not found');
    }

    if (pass.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own passes');
    }

    if (pass.status !== DrinkPassStatus.ACTIVE) {
      throw new BadRequestException('Can only cancel active passes');
    }

    return this.prisma.drinkPass.update({
      where: { id: passId },
      data: { status: DrinkPassStatus.CANCELLED },
    });
  }

  async createDrinkReward(data: {
    questId: string;
    sponsorId: string;
    name: string;
    description?: string;
    drinkType?: string;
    maxRedemptions?: number;
    validityHours?: number;
  }) {
    return this.prisma.drinkReward.create({
      data: {
        questId: data.questId,
        sponsorId: data.sponsorId,
        name: data.name,
        description: data.description,
        drinkType: data.drinkType,
        maxRedemptions: data.maxRedemptions,
        validityHours: data.validityHours || 24,
      },
    });
  }
}
