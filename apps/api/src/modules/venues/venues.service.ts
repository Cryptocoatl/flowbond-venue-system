import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Venue } from '@prisma/client';

@Injectable()
export class VenuesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Venue[]> {
    return this.prisma.venue.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        zones: {
          where: { isActive: true },
          include: {
            qrPoints: {
              where: { isActive: true },
            },
          },
        },
        sponsors: {
          where: { isActive: true },
          include: {
            sponsor: true,
          },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    return venue;
  }

  async findBySlug(slug: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { slug },
      include: {
        zones: {
          where: { isActive: true },
          include: {
            qrPoints: {
              where: { isActive: true },
            },
          },
        },
        sponsors: {
          where: { isActive: true },
          include: {
            sponsor: {
              include: {
                quests: {
                  where: { isActive: true },
                  include: {
                    tasks: {
                      orderBy: { order: 'asc' },
                    },
                    drinkReward: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    return venue;
  }

  async getActiveQuests(venueId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
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
                    tasks: {
                      orderBy: { order: 'asc' },
                    },
                    drinkReward: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Flatten quests from all sponsors
    return venue.sponsors.flatMap((sv) => sv.sponsor.quests);
  }

  async getPublicMenu(venueId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    return this.prisma.menuCategory.findMany({
      where: { venueId },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    address?: string;
    city?: string;
    timezone?: string;
  }): Promise<Venue> {
    return this.prisma.venue.create({ data });
  }

  async createZone(venueId: string, data: { name: string; description?: string }) {
    return this.prisma.zone.create({
      data: {
        ...data,
        venueId,
      },
    });
  }
}
