import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { EntityType, ApprovalStatus, Role } from '@prisma/client';
import {
  RegisterVenueDto,
  RegisterEventDto,
  RegisterBrandDto,
} from './dto/registration.dto';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
  ) {}

  async registerVenue(dto: RegisterVenueDto, userId: string) {
    // Check slug availability
    const existingSlug = await this.prisma.entityRegistration.findFirst({
      where: { slug: dto.slug },
    });

    const existingVenue = await this.prisma.venue.findFirst({
      where: { slug: dto.slug },
    });

    if (existingSlug || existingVenue) {
      throw new ConflictException('This slug is already taken');
    }

    // Create registration
    return this.prisma.entityRegistration.create({
      data: {
        type: EntityType.VENUE,
        ownerId: userId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        data: {
          address: dto.address,
          city: dto.city,
          timezone: dto.timezone || 'America/Chicago',
        },
      },
    });
  }

  async registerEvent(dto: RegisterEventDto, userId: string) {
    // Check slug availability
    const existingSlug = await this.prisma.entityRegistration.findFirst({
      where: { slug: dto.slug },
    });

    const existingEvent = await this.prisma.event.findFirst({
      where: { slug: dto.slug },
    });

    if (existingSlug || existingEvent) {
      throw new ConflictException('This slug is already taken');
    }

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Create registration
    return this.prisma.entityRegistration.create({
      data: {
        type: EntityType.EVENT,
        ownerId: userId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        data: {
          startDate: dto.startDate,
          endDate: dto.endDate,
          timezone: dto.timezone || 'America/Chicago',
        },
      },
    });
  }

  async registerBrand(dto: RegisterBrandDto, userId: string) {
    // Check slug availability
    const existingSlug = await this.prisma.entityRegistration.findFirst({
      where: { slug: dto.slug },
    });

    const existingBrand = await this.prisma.brand.findFirst({
      where: { slug: dto.slug },
    });

    if (existingSlug || existingBrand) {
      throw new ConflictException('This slug is already taken');
    }

    // Create registration
    return this.prisma.entityRegistration.create({
      data: {
        type: EntityType.BRAND,
        ownerId: userId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        data: {
          website: dto.website,
        },
      },
    });
  }

  async getMyRegistrations(userId: string) {
    return this.prisma.entityRegistration.findMany({
      where: { ownerId: userId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getRegistration(id: string) {
    const registration = await this.prisma.entityRegistration.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true, name: true },
        },
        reviewedBy: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration;
  }

  async getPendingRegistrations() {
    return this.prisma.entityRegistration.findMany({
      where: { status: ApprovalStatus.PENDING },
      include: {
        owner: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async approveRegistration(id: string, reviewerId: string, reviewNotes?: string) {
    const registration = await this.getRegistration(id);

    if (registration.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Registration has already been reviewed');
    }

    // Create the actual entity based on type
    const entityId = await this.createEntity(registration);

    // Update registration status
    await this.prisma.entityRegistration.update({
      where: { id },
      data: {
        status: ApprovalStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        reviewNotes,
      },
    });

    // Assign owner role
    const roleMap: Record<EntityType, Role> = {
      [EntityType.VENUE]: Role.VENUE_OWNER,
      [EntityType.EVENT]: Role.EVENT_OWNER,
      [EntityType.BRAND]: Role.BRAND_OWNER,
    };

    await this.rolesService.assignRole(
      registration.ownerId,
      roleMap[registration.type],
      registration.type,
      entityId,
      reviewerId,
    );

    return { entityId, entityType: registration.type };
  }

  async rejectRegistration(id: string, reviewerId: string, reviewNotes?: string) {
    const registration = await this.getRegistration(id);

    if (registration.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Registration has already been reviewed');
    }

    return this.prisma.entityRegistration.update({
      where: { id },
      data: {
        status: ApprovalStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        reviewNotes,
      },
    });
  }

  private async createEntity(registration: any): Promise<string> {
    const data = registration.data as Record<string, any> || {};

    switch (registration.type) {
      case EntityType.VENUE: {
        const venue = await this.prisma.venue.create({
          data: {
            name: registration.name,
            slug: registration.slug,
            description: registration.description,
            address: data.address,
            city: data.city,
            timezone: data.timezone || 'America/Chicago',
            ownerId: registration.ownerId,
            status: ApprovalStatus.APPROVED,
          },
        });
        return venue.id;
      }

      case EntityType.EVENT: {
        const event = await this.prisma.event.create({
          data: {
            name: registration.name,
            slug: registration.slug,
            description: registration.description,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            timezone: data.timezone || 'America/Chicago',
            ownerId: registration.ownerId,
            status: ApprovalStatus.APPROVED,
          },
        });
        return event.id;
      }

      case EntityType.BRAND: {
        const brand = await this.prisma.brand.create({
          data: {
            name: registration.name,
            slug: registration.slug,
            description: registration.description,
            website: data.website,
            ownerId: registration.ownerId,
            status: ApprovalStatus.APPROVED,
          },
        });
        return brand.id;
      }

      default:
        throw new BadRequestException('Invalid entity type');
    }
  }
}
