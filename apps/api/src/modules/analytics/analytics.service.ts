import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getVenueStats(venueId: string) {
    const [totalQRScans, totalQuests, totalDrinkPasses] = await Promise.all([
      this.prisma.qRPoint.aggregate({
        _sum: { scanCount: true },
        where: { zone: { venueId } },
      }),
      this.prisma.sponsorQuest.count({
        where: { sponsor: { venues: { some: { venueId } } } },
      }),
      this.prisma.drinkPass.count({
        where: { venueId },
      }),
    ]);

    return {
      totalQRScans: totalQRScans._sum.scanCount ?? 0,
      totalQuests,
      totalDrinkPasses,
    };
  }

  async getSponsorStats(sponsorId: string) {
    const [totalQuests, completedQuests, totalRedemptions] = await Promise.all([
      this.prisma.sponsorQuest.count({ where: { sponsorId } }),
      this.prisma.questProgress.count({
        where: { quest: { sponsorId }, status: 'COMPLETED' },
      }),
      this.prisma.drinkPass.count({
        where: { reward: { sponsorId }, status: 'REDEEMED' },
      }),
    ]);

    return {
      totalQuests,
      completedQuests,
      totalRedemptions,
    };
  }

  async getQuestCompletionRate(questId: string) {
    const [total, completed] = await Promise.all([
      this.prisma.questProgress.count({ where: { questId } }),
      this.prisma.questProgress.count({ where: { questId, status: 'COMPLETED' } }),
    ]);

    return {
      total,
      completed,
      rate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  async trackQRScan(qrPointId: string) {
    return this.prisma.qRPoint.update({
      where: { id: qrPointId },
      data: { scanCount: { increment: 1 } },
    });
  }
}
