import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ManageService } from './manage.service';

@Controller('manage/venues')
@UseGuards(JwtAuthGuard)
export class ManageVenuesController {
  constructor(private manageService: ManageService) {}

  @Get()
  async getMyVenues(@Request() req: any) {
    return this.manageService.getMyVenues(req.user.userId);
  }

  @Get(':id')
  async getVenue(@Param('id') id: string, @Request() req: any) {
    return this.manageService.getVenue(id, req.user.userId);
  }

  @Put(':id')
  async updateVenue(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
      address?: string;
      city?: string;
      timezone?: string;
      logoUrl?: string;
      bannerUrl?: string;
    },
    @Request() req: any,
  ) {
    return this.manageService.updateVenue(id, req.user.userId, body);
  }
}
