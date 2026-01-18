import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VenuesService } from './venues.service';

@ApiTags('venues')
@Controller('venues')
export class VenuesController {
  constructor(private venuesService: VenuesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active venues' })
  @ApiResponse({ status: 200, description: 'List of venues' })
  async findAll() {
    return this.venuesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get venue by ID' })
  @ApiResponse({ status: 200, description: 'Venue details' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  async findById(@Param('id') id: string) {
    return this.venuesService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get venue by slug' })
  @ApiResponse({ status: 200, description: 'Venue details' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.venuesService.findBySlug(slug);
  }

  @Get(':id/quests')
  @ApiOperation({ summary: 'Get active quests at a venue' })
  @ApiResponse({ status: 200, description: 'List of active quests' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  async getActiveQuests(@Param('id') id: string) {
    return this.venuesService.getActiveQuests(id);
  }

  @Get(':id/menu')
  @ApiOperation({ summary: 'Get public menu for a venue' })
  @ApiResponse({ status: 200, description: 'Menu categories with items' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  async getPublicMenu(@Param('id') id: string) {
    return this.venuesService.getPublicMenu(id);
  }
}
