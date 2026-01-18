import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { nanoid } from 'nanoid';

export interface QRContext {
  qrPoint: {
    id: string;
    code: string;
    name: string | null;
  };
  zone: {
    id: string;
    name: string;
  };
  venue: {
    id: string;
    name: string;
    slug: string;
  };
  sponsor: {
    id: string;
    name: string;
    slug: string;
  } | null;
  availableQuests: Array<{
    id: string;
    name: string;
    description: string | null;
    taskCount: number;
    drinkReward: {
      name: string;
      drinkType: string | null;
    } | null;
  }>;
}

@Injectable()
export class QRService {
  constructor(private prisma: PrismaService) {}

  async resolveQRCode(code: string): Promise<QRContext> {
    const qrPoint = await this.prisma.qRPoint.findUnique({
      where: { code },
      include: {
        zone: {
          include: {
            venue: {
              include: {
                sponsors: {
                  where: { isActive: true },
                  include: {
                    sponsor: {
                      include: {
                        quests: {
                          where: {
                            isActive: true,
                            OR: [
                              { startDate: null },
                              { startDate: { lte: new Date() } },
                            ],
                            AND: [
                              {
                                OR: [
                                  { endDate: null },
                                  { endDate: { gte: new Date() } },
                                ],
                              },
                            ],
                          },
                          include: {
                            tasks: true,
                            drinkReward: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        sponsor: true,
      },
    });

    if (!qrPoint || !qrPoint.isActive) {
      throw new NotFoundException('QR code not found or inactive');
    }

    // Increment scan count
    await this.prisma.qRPoint.update({
      where: { id: qrPoint.id },
      data: { scanCount: { increment: 1 } },
    });

    // Get available quests
    const availableQuests = qrPoint.zone.venue.sponsors.flatMap((sv) =>
      sv.sponsor.quests.map((quest) => ({
        id: quest.id,
        name: quest.name,
        description: quest.description,
        taskCount: quest.tasks.length,
        drinkReward: quest.drinkReward
          ? {
              name: quest.drinkReward.name,
              drinkType: quest.drinkReward.drinkType,
            }
          : null,
      })),
    );

    return {
      qrPoint: {
        id: qrPoint.id,
        code: qrPoint.code,
        name: qrPoint.name,
      },
      zone: {
        id: qrPoint.zone.id,
        name: qrPoint.zone.name,
      },
      venue: {
        id: qrPoint.zone.venue.id,
        name: qrPoint.zone.venue.name,
        slug: qrPoint.zone.venue.slug,
      },
      sponsor: qrPoint.sponsor
        ? {
            id: qrPoint.sponsor.id,
            name: qrPoint.sponsor.name,
            slug: qrPoint.sponsor.slug,
          }
        : null,
      availableQuests,
    };
  }

  async createQRPoint(data: {
    zoneId: string;
    sponsorId?: string;
    name?: string;
    description?: string;
  }) {
    const code = nanoid(10).toUpperCase();

    return this.prisma.qRPoint.create({
      data: {
        code,
        name: data.name,
        description: data.description,
        zoneId: data.zoneId,
        sponsorId: data.sponsorId,
      },
    });
  }

  async getQRPointByCode(code: string) {
    return this.prisma.qRPoint.findUnique({
      where: { code },
      include: {
        zone: {
          include: {
            venue: true,
          },
        },
        sponsor: true,
      },
    });
  }
}
