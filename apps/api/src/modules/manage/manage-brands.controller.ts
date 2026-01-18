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

@Controller('manage/brands')
@UseGuards(JwtAuthGuard)
export class ManageBrandsController {
  constructor(private manageService: ManageService) {}

  @Get()
  async getMyBrands(@Request() req: any) {
    return this.manageService.getMyBrands(req.user.userId);
  }

  @Get(':id')
  async getBrand(@Param('id') id: string, @Request() req: any) {
    return this.manageService.getBrand(id, req.user.userId);
  }

  @Put(':id')
  async updateBrand(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
      website?: string;
      logoUrl?: string;
      bannerUrl?: string;
    },
    @Request() req: any,
  ) {
    return this.manageService.updateBrand(id, req.user.userId, body);
  }
}
