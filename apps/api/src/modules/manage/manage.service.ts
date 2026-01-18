import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EntityType, Role } from '@prisma/client';

@Injectable()
export class ManageService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // Venues
  // ==========================================

  async getMyVenues(userId: string) {
    // Get venues where user is owner or has a management role
    const venues = await this.prisma.venue.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            userRoles: {
              some: {
                userId,
                role: { in: [Role.VENUE_OWNER, Role.VENUE_MANAGER] },
              },
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return venues;
  }

  async getVenue(venueId: string, userId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        menuCategories: {
          include: {
            items: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Check access
    const hasAccess = await this.checkVenueAccess(venueId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this venue');
    }

    return venue;
  }

  async updateVenue(venueId: string, userId: string, data: {
    name?: string;
    description?: string;
    address?: string;
    city?: string;
    timezone?: string;
    logoUrl?: string;
    bannerUrl?: string;
  }) {
    // Check access
    const hasAccess = await this.checkVenueAccess(venueId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this venue');
    }

    return this.prisma.venue.update({
      where: { id: venueId },
      data,
    });
  }

  async checkVenueAccess(venueId: string, userId: string): Promise<boolean> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { ownerId: true },
    });

    if (!venue) return false;

    // Owner has access
    if (venue.ownerId === userId) return true;

    // Check for role-based access
    const role = await this.prisma.userRole.findFirst({
      where: {
        userId,
        entityType: EntityType.VENUE,
        entityId: venueId,
        role: { in: [Role.VENUE_OWNER, Role.VENUE_MANAGER, Role.VENUE_STAFF] },
      },
    });

    return !!role;
  }

  // ==========================================
  // Events
  // ==========================================

  async getMyEvents(userId: string) {
    const events = await this.prisma.event.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            userRoles: {
              some: {
                userId,
                role: { in: [Role.EVENT_OWNER, Role.EVENT_STAFF] },
              },
            },
          },
        ],
      },
      orderBy: { startDate: 'desc' },
    });

    return events;
  }

  async getEvent(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venues: {
          include: { venue: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check access
    const hasAccess = await this.checkEventAccess(eventId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this event');
    }

    return event;
  }

  async updateEvent(eventId: string, userId: string, data: {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    timezone?: string;
    logoUrl?: string;
    bannerUrl?: string;
  }) {
    const hasAccess = await this.checkEventAccess(eventId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this event');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data,
    });
  }

  async checkEventAccess(eventId: string, userId: string): Promise<boolean> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true },
    });

    if (!event) return false;

    if (event.ownerId === userId) return true;

    const role = await this.prisma.userRole.findFirst({
      where: {
        userId,
        entityType: EntityType.EVENT,
        entityId: eventId,
        role: { in: [Role.EVENT_OWNER, Role.EVENT_STAFF] },
      },
    });

    return !!role;
  }

  // ==========================================
  // Brands
  // ==========================================

  async getMyBrands(userId: string) {
    const brands = await this.prisma.brand.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            userRoles: {
              some: {
                userId,
                role: { in: [Role.BRAND_OWNER, Role.BRAND_MANAGER] },
              },
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return brands;
  }

  async getBrand(brandId: string, userId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const hasAccess = await this.checkBrandAccess(brandId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this brand');
    }

    return brand;
  }

  async updateBrand(brandId: string, userId: string, data: {
    name?: string;
    description?: string;
    website?: string;
    logoUrl?: string;
    bannerUrl?: string;
  }) {
    const hasAccess = await this.checkBrandAccess(brandId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this brand');
    }

    return this.prisma.brand.update({
      where: { id: brandId },
      data,
    });
  }

  async checkBrandAccess(brandId: string, userId: string): Promise<boolean> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { ownerId: true },
    });

    if (!brand) return false;

    if (brand.ownerId === userId) return true;

    const role = await this.prisma.userRole.findFirst({
      where: {
        userId,
        entityType: EntityType.BRAND,
        entityId: brandId,
        role: { in: [Role.BRAND_OWNER, Role.BRAND_MANAGER] },
      },
    });

    return !!role;
  }
}
