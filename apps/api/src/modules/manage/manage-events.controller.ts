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

@Controller('manage/events')
@UseGuards(JwtAuthGuard)
export class ManageEventsController {
  constructor(private manageService: ManageService) {}

  @Get()
  async getMyEvents(@Request() req: any) {
    return this.manageService.getMyEvents(req.user.userId);
  }

  @Get(':id')
  async getEvent(@Param('id') id: string, @Request() req: any) {
    return this.manageService.getEvent(id, req.user.userId);
  }

  @Put(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      timezone?: string;
      logoUrl?: string;
      bannerUrl?: string;
    },
    @Request() req: any,
  ) {
    const data: any = { ...body };
    if (body.startDate) data.startDate = new Date(body.startDate);
    if (body.endDate) data.endDate = new Date(body.endDate);
    return this.manageService.updateEvent(id, req.user.userId, data);
  }
}
