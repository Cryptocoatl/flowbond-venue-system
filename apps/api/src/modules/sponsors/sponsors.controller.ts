import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SponsorsService } from './sponsors.service';

@ApiTags('sponsors')
@Controller('sponsors')
export class SponsorsController {
  constructor(private sponsorsService: SponsorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active sponsors' })
  @ApiResponse({ status: 200, description: 'List of sponsors' })
  async findAll() {
    return this.sponsorsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sponsor by ID' })
  @ApiResponse({ status: 200, description: 'Sponsor details' })
  @ApiResponse({ status: 404, description: 'Sponsor not found' })
  async findById(@Param('id') id: string) {
    return this.sponsorsService.findById(id);
  }

  @Get(':id/quests')
  @ApiOperation({ summary: 'Get sponsor quests' })
  @ApiResponse({ status: 200, description: 'List of quests' })
  @ApiResponse({ status: 404, description: 'Sponsor not found' })
  async getQuests(@Param('id') id: string) {
    return this.sponsorsService.getQuests(id);
  }
}
