import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ManageService } from './manage.service';
import { MenuItemType } from '@prisma/client';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private manageService: ManageService,
  ) {}

  // ==========================================
  // Categories
  // ==========================================

  async getCategories(venueId: string, userId: string) {
    const hasAccess = await this.manageService.checkVenueAccess(venueId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this venue');
    }

    return this.prisma.menuCategory.findMany({
      where: { venueId },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createCategory(venueId: string, userId: string, data: {
    name: string;
    description?: string;
    displayOrder?: number;
  }) {
    const hasAccess = await this.manageService.checkVenueAccess(venueId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this venue');
    }

    // Get the highest sort order
    const maxOrder = await this.prisma.menuCategory.aggregate({
      where: { venueId },
      _max: { displayOrder: true },
    });

    return this.prisma.menuCategory.create({
      data: {
        name: data.name,
        description: data.description,
        displayOrder: data.displayOrder ?? (maxOrder._max.displayOrder ?? 0) + 1,
        venueId,
      },
      include: {
        items: true,
      },
    });
  }

  async updateCategory(categoryId: string, userId: string, data: {
    name?: string;
    description?: string;
    displayOrder?: number;
  }) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
      select: { venueId: true, eventId: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check access based on whether it's a venue or event category
    if (category.venueId) {
      const hasAccess = await this.manageService.checkVenueAccess(category.venueId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this category');
      }
    } else if (category.eventId) {
      const hasAccess = await this.manageService.checkEventAccess(category.eventId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this category');
      }
    }

    return this.prisma.menuCategory.update({
      where: { id: categoryId },
      data,
      include: {
        items: true,
      },
    });
  }

  async deleteCategory(categoryId: string, userId: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
      select: { venueId: true, eventId: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check access
    if (category.venueId) {
      const hasAccess = await this.manageService.checkVenueAccess(category.venueId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this category');
      }
    } else if (category.eventId) {
      const hasAccess = await this.manageService.checkEventAccess(category.eventId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this category');
      }
    }

    // Delete items first, then category
    await this.prisma.menuItem.deleteMany({
      where: { categoryId },
    });

    return this.prisma.menuCategory.delete({
      where: { id: categoryId },
    });
  }

  // ==========================================
  // Items
  // ==========================================

  async createItem(categoryId: string, userId: string, data: {
    name: string;
    description?: string;
    price: number;
    type?: MenuItemType;
    imageUrl?: string;
    isAvailable?: boolean;
  }) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
      select: { venueId: true, eventId: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check access
    if (category.venueId) {
      const hasAccess = await this.manageService.checkVenueAccess(category.venueId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this category');
      }
    } else if (category.eventId) {
      const hasAccess = await this.manageService.checkEventAccess(category.eventId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this category');
      }
    }

    // Get the highest sort order
    const maxOrder = await this.prisma.menuItem.aggregate({
      where: { categoryId },
      _max: { displayOrder: true },
    });

    return this.prisma.menuItem.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        type: data.type || MenuItemType.OTHER,
        imageUrl: data.imageUrl,
        isAvailable: data.isAvailable ?? true,
        displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
        categoryId,
      },
    });
  }

  async updateItem(itemId: string, userId: string, data: {
    name?: string;
    description?: string;
    price?: number;
    type?: MenuItemType;
    imageUrl?: string;
    isAvailable?: boolean;
    displayOrder?: number;
  }) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        category: {
          select: { venueId: true, eventId: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    // Check access
    if (item.category.venueId) {
      const hasAccess = await this.manageService.checkVenueAccess(item.category.venueId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this item');
      }
    } else if (item.category.eventId) {
      const hasAccess = await this.manageService.checkEventAccess(item.category.eventId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this item');
      }
    }

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data,
    });
  }

  async deleteItem(itemId: string, userId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        category: {
          select: { venueId: true, eventId: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    // Check access
    if (item.category.venueId) {
      const hasAccess = await this.manageService.checkVenueAccess(item.category.venueId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this item');
      }
    } else if (item.category.eventId) {
      const hasAccess = await this.manageService.checkEventAccess(item.category.eventId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this item');
      }
    }

    return this.prisma.menuItem.delete({
      where: { id: itemId },
    });
  }

  // ==========================================
  // Public Menu (for consumers)
  // ==========================================

  async getPublicMenu(venueId: string) {
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
}
