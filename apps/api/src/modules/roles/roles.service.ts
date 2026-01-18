import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Role, EntityType } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async assignRole(
    userId: string,
    role: Role,
    entityType?: EntityType,
    entityId?: string,
    grantedById?: string,
  ) {
    // Check if role already exists
    const existing = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.userRole.create({
      data: {
        userId,
        role,
        entityType,
        entityId,
        grantedById,
      },
    });
  }

  async removeRole(
    userId: string,
    role: Role,
    entityType?: EntityType,
    entityId?: string,
  ) {
    return this.prisma.userRole.deleteMany({
      where: {
        userId,
        role,
        entityType: entityType || null,
        entityId: entityId || null,
      },
    });
  }

  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: {
        grantedBy: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async hasRole(
    userId: string,
    roles: Role[],
    entityType?: EntityType,
    entityId?: string,
  ): Promise<boolean> {
    // Check for SUPER_ADMIN first (has all permissions)
    const isSuperAdmin = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: Role.SUPER_ADMIN,
      },
    });

    if (isSuperAdmin) return true;

    // Check for specific roles
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: { in: roles },
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
      },
    });

    return !!userRole;
  }

  async canAccessEntity(
    userId: string,
    entityType: EntityType,
    entityId: string,
  ): Promise<boolean> {
    // SUPER_ADMIN can access everything
    const isSuperAdmin = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: Role.SUPER_ADMIN,
      },
    });

    if (isSuperAdmin) return true;

    // Check ownership based on entity type
    switch (entityType) {
      case EntityType.VENUE:
        return this.canAccessVenue(userId, entityId);
      case EntityType.EVENT:
        return this.canAccessEvent(userId, entityId);
      case EntityType.BRAND:
        return this.canAccessBrand(userId, entityId);
      default:
        return false;
    }
  }

  private async canAccessVenue(userId: string, venueId: string): Promise<boolean> {
    // Check if user owns the venue
    const venue = await this.prisma.venue.findFirst({
      where: {
        id: venueId,
        ownerId: userId,
      },
    });

    if (venue) return true;

    // Check if user has a role for this venue
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        entityType: EntityType.VENUE,
        entityId: venueId,
        role: {
          in: [Role.VENUE_OWNER, Role.VENUE_MANAGER, Role.VENUE_STAFF],
        },
      },
    });

    return !!userRole;
  }

  private async canAccessEvent(userId: string, eventId: string): Promise<boolean> {
    // Check if user owns the event
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        ownerId: userId,
      },
    });

    if (event) return true;

    // Check if user has a role for this event
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        entityType: EntityType.EVENT,
        entityId: eventId,
        role: {
          in: [Role.EVENT_OWNER, Role.EVENT_STAFF],
        },
      },
    });

    return !!userRole;
  }

  private async canAccessBrand(userId: string, brandId: string): Promise<boolean> {
    // Check if user owns the brand
    const brand = await this.prisma.brand.findFirst({
      where: {
        id: brandId,
        ownerId: userId,
      },
    });

    if (brand) return true;

    // Check if user has a role for this brand
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        entityType: EntityType.BRAND,
        entityId: brandId,
        role: {
          in: [Role.BRAND_OWNER, Role.BRAND_MANAGER],
        },
      },
    });

    return !!userRole;
  }

  async getEntityOwner(entityType: EntityType, entityId: string) {
    switch (entityType) {
      case EntityType.VENUE:
        const venue = await this.prisma.venue.findUnique({
          where: { id: entityId },
          select: { ownerId: true },
        });
        return venue?.ownerId;
      case EntityType.EVENT:
        const event = await this.prisma.event.findUnique({
          where: { id: entityId },
          select: { ownerId: true },
        });
        return event?.ownerId;
      case EntityType.BRAND:
        const brand = await this.prisma.brand.findUnique({
          where: { id: entityId },
          select: { ownerId: true },
        });
        return brand?.ownerId;
      default:
        return null;
    }
  }
}
