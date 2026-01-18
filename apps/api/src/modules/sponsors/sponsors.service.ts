import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Sponsor } from '@prisma/client';

@Injectable()
export class SponsorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Sponsor[]> {
    return this.prisma.sponsor.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { id },
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
        venues: {
          include: {
            venue: true,
          },
        },
      },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    return sponsor;
  }

  async findBySlug(slug: string) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { slug },
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
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    return sponsor;
  }

  async getQuests(sponsorId: string) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { id: sponsorId },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    return this.prisma.sponsorQuest.findMany({
      where: {
        sponsorId,
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
    });
  }

  async create(data: {
    name: string;
    slug: string;
    logo?: string;
    description?: string;
    website?: string;
  }): Promise<Sponsor> {
    return this.prisma.sponsor.create({ data });
  }

  async addToVenue(sponsorId: string, venueId: string) {
    return this.prisma.sponsorVenue.create({
      data: {
        sponsorId,
        venueId,
      },
    });
  }
}
