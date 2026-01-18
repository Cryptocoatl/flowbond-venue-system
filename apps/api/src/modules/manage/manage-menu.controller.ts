import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MenuService } from './menu.service';
import { MenuItemType } from '@prisma/client';

@Controller('manage')
@UseGuards(JwtAuthGuard)
export class ManageMenuController {
  constructor(private menuService: MenuService) {}

  // ==========================================
  // Categories
  // ==========================================

  @Get('venues/:venueId/menu/categories')
  async getCategories(@Param('venueId') venueId: string, @Request() req: any) {
    return this.menuService.getCategories(venueId, req.user.userId);
  }

  @Post('venues/:venueId/menu/categories')
  async createCategory(
    @Param('venueId') venueId: string,
    @Body() body: {
      name: string;
      description?: string;
      displayOrder?: number;
    },
    @Request() req: any,
  ) {
    return this.menuService.createCategory(venueId, req.user.userId, body);
  }

  @Put('menu/categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
      displayOrder?: number;
    },
    @Request() req: any,
  ) {
    return this.menuService.updateCategory(id, req.user.userId, body);
  }

  @Delete('menu/categories/:id')
  async deleteCategory(@Param('id') id: string, @Request() req: any) {
    return this.menuService.deleteCategory(id, req.user.userId);
  }

  // ==========================================
  // Items
  // ==========================================

  @Post('menu/categories/:categoryId/items')
  async createItem(
    @Param('categoryId') categoryId: string,
    @Body() body: {
      name: string;
      description?: string;
      price: number;
      type?: MenuItemType;
      imageUrl?: string;
      isAvailable?: boolean;
    },
    @Request() req: any,
  ) {
    return this.menuService.createItem(categoryId, req.user.userId, body);
  }

  @Put('menu/items/:id')
  async updateItem(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
      price?: number;
      type?: MenuItemType;
      imageUrl?: string;
      isAvailable?: boolean;
      displayOrder?: number;
    },
    @Request() req: any,
  ) {
    return this.menuService.updateItem(id, req.user.userId, body);
  }

  @Delete('menu/items/:id')
  async deleteItem(@Param('id') id: string, @Request() req: any) {
    return this.menuService.deleteItem(id, req.user.userId);
  }
}
