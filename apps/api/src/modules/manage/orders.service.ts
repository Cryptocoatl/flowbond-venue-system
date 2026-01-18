import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ManageService } from './manage.service';
import { OrderStatus, OrderItemSource } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private manageService: ManageService,
  ) {}

  // ==========================================
  // Customer-facing methods
  // ==========================================

  async createOrder(userId: string, venueId: string) {
    // Verify venue exists
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber(venue.slug);

    return this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        venueId,
        status: OrderStatus.DRAFT,
        totalAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        venue: true,
      },
    });
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        venue: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // User can only see their own orders (or venue staff)
    if (order.userId !== userId) {
      const hasAccess = await this.manageService.checkVenueAccess(order.venueId, userId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this order');
      }
    }

    return order;
  }

  async addItem(orderId: string, userId: string, data: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You can only add items to your own orders');
    }

    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Cannot modify a non-draft order');
    }

    // Get menu item
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: data.menuItemId },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    if (!menuItem.isAvailable) {
      throw new BadRequestException('This item is not available');
    }

    // Check if item already in order
    const existingItem = await this.prisma.orderItem.findFirst({
      where: {
        orderId,
        menuItemId: data.menuItemId,
        source: OrderItemSource.PURCHASED,
      },
    });

    if (existingItem) {
      // Update quantity
      await this.prisma.orderItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + data.quantity,
          notes: data.notes || existingItem.notes,
        },
      });
    } else {
      // Create new item
      await this.prisma.orderItem.create({
        data: {
          orderId,
          menuItemId: data.menuItemId,
          quantity: data.quantity,
          unitPrice: menuItem.price,
          source: OrderItemSource.PURCHASED,
          notes: data.notes,
        },
      });
    }

    // Recalculate total
    await this.recalculateOrderTotal(orderId);

    return this.getOrder(orderId, userId);
  }

  async removeItem(orderId: string, userId: string, itemId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You can only modify your own orders');
    }

    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Cannot modify a non-draft order');
    }

    await this.prisma.orderItem.delete({
      where: { id: itemId },
    });

    // Recalculate total
    await this.recalculateOrderTotal(orderId);

    return this.getOrder(orderId, userId);
  }

  async redeemPass(orderId: string, userId: string, passId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You can only modify your own orders');
    }

    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Cannot modify a non-draft order');
    }

    // Get the item pass
    const pass = await this.prisma.itemPass.findUnique({
      where: { id: passId },
      include: { menuItem: true },
    });

    if (!pass || pass.userId !== userId) {
      throw new NotFoundException('Pass not found');
    }

    if (pass.status !== 'ACTIVE' || !pass.menuItemId) {
      throw new BadRequestException('This pass cannot be redeemed');
    }

    // Add as redeemed item
    await this.prisma.orderItem.create({
      data: {
        orderId,
        menuItemId: pass.menuItemId,
        quantity: 1,
        unitPrice: 0,
        source: OrderItemSource.REDEEMED,
        itemPassId: passId,
      },
    });

    return this.getOrder(orderId, userId);
  }

  async checkout(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You can only checkout your own orders');
    }

    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('This order has already been submitted');
    }

    if (order.items.length === 0) {
      throw new BadRequestException('Cannot checkout an empty order');
    }

    // Mark any redeemed passes as used
    const redeemedItems = order.items.filter(i => i.source === OrderItemSource.REDEEMED && i.itemPassId);
    for (const item of redeemedItems) {
      await this.prisma.itemPass.update({
        where: { id: item.itemPassId! },
        data: {
          status: 'REDEEMED',
          redeemedAt: new Date(),
        },
      });
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: order.totalAmount > 0 ? OrderStatus.PENDING_PAYMENT : OrderStatus.CONFIRMED,
      },
      include: {
        items: {
          include: { menuItem: true },
        },
        venue: true,
      },
    });

    return updatedOrder;
  }

  // ==========================================
  // Venue management methods
  // ==========================================

  async getVenueOrders(venueId: string, userId: string, status?: OrderStatus) {
    const hasAccess = await this.manageService.checkVenueAccess(venueId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this venue');
    }

    const where: any = { venueId };
    if (status) {
      where.status = status;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: { menuItem: true },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(orderId: string, userId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const hasAccess = await this.manageService.checkVenueAccess(order.venueId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to manage this order');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: { menuItem: true },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  // ==========================================
  // Helper methods
  // ==========================================

  private async generateOrderNumber(venueSlug: string): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const prefix = venueSlug.slice(0, 3).toUpperCase();

    // Get count of orders for this venue today
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const count = await this.prisma.order.count({
      where: {
        venue: { slug: venueSlug },
        createdAt: { gte: startOfDay },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');

    return `${prefix}-${dateStr}-${sequence}`;
  }

  private async recalculateOrderTotal(orderId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    const totalAmount = items.reduce((sum, item) => {
      return sum + item.unitPrice * item.quantity;
    }, 0);

    await this.prisma.order.update({
      where: { id: orderId },
      data: { totalAmount },
    });
  }
}
