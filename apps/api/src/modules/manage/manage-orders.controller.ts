import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { OrderStatus } from '@prisma/client';

// Customer-facing orders controller
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @Body() body: { venueId: string },
    @Request() req: any,
  ) {
    return this.ordersService.createOrder(req.user.userId, body.venueId);
  }

  @Get('my')
  async getMyOrders(@Request() req: any) {
    return this.ordersService.getMyOrders(req.user.userId);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.getOrder(id, req.user.userId);
  }

  @Post(':id/items')
  async addItem(
    @Param('id') orderId: string,
    @Body() body: {
      menuItemId: string;
      quantity: number;
      notes?: string;
    },
    @Request() req: any,
  ) {
    return this.ordersService.addItem(orderId, req.user.userId, body);
  }

  @Delete(':orderId/items/:itemId')
  async removeItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Request() req: any,
  ) {
    return this.ordersService.removeItem(orderId, req.user.userId, itemId);
  }

  @Post(':id/redeem')
  async redeemPass(
    @Param('id') orderId: string,
    @Body() body: { passId: string },
    @Request() req: any,
  ) {
    return this.ordersService.redeemPass(orderId, req.user.userId, body.passId);
  }

  @Post(':id/checkout')
  async checkout(@Param('id') orderId: string, @Request() req: any) {
    return this.ordersService.checkout(orderId, req.user.userId);
  }
}

// Venue management orders controller
@Controller('manage')
@UseGuards(JwtAuthGuard)
export class ManageOrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get('venues/:venueId/orders')
  async getVenueOrders(
    @Param('venueId') venueId: string,
    @Query('status') status: OrderStatus,
    @Request() req: any,
  ) {
    return this.ordersService.getVenueOrders(venueId, req.user.userId, status);
  }

  @Put('orders/:id/status')
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() body: { status: OrderStatus },
    @Request() req: any,
  ) {
    return this.ordersService.updateOrderStatus(orderId, req.user.userId, body.status);
  }
}
