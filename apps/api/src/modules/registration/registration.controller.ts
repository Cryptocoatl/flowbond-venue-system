import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import {
  RegisterVenueDto,
  RegisterEventDto,
  RegisterBrandDto,
  ReviewRegistrationDto,
} from './dto/registration.dto';
import { Roles } from '../roles/decorators/roles.decorator';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('registration')
@Controller('registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post('venue')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new venue' })
  @ApiResponse({ status: 201, description: 'Registration submitted' })
  @ApiResponse({ status: 409, description: 'Slug already taken' })
  async registerVenue(
    @Body() dto: RegisterVenueDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.registrationService.registerVenue(dto, req.user.id);
  }

  @Post('event')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new event' })
  @ApiResponse({ status: 201, description: 'Registration submitted' })
  @ApiResponse({ status: 409, description: 'Slug already taken' })
  async registerEvent(
    @Body() dto: RegisterEventDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.registrationService.registerEvent(dto, req.user.id);
  }

  @Post('brand')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new brand' })
  @ApiResponse({ status: 201, description: 'Registration submitted' })
  @ApiResponse({ status: 409, description: 'Slug already taken' })
  async registerBrand(
    @Body() dto: RegisterBrandDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.registrationService.registerBrand(dto, req.user.id);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my registrations' })
  async getMyRegistrations(@Request() req: { user: { id: string } }) {
    return this.registrationService.getMyRegistrations(req.user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get registration details' })
  async getRegistration(@Param('id') id: string) {
    return this.registrationService.getRegistration(id);
  }
}

@ApiTags('admin')
@Controller('admin/registrations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminRegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Get()
  @ApiOperation({ summary: 'Get pending registrations (Admin only)' })
  async getPendingRegistrations() {
    return this.registrationService.getPendingRegistrations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get registration details (Admin only)' })
  async getRegistration(@Param('id') id: string) {
    return this.registrationService.getRegistration(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve registration (Admin only)' })
  async approveRegistration(
    @Param('id') id: string,
    @Body() dto: ReviewRegistrationDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.registrationService.approveRegistration(
      id,
      req.user.id,
      dto.reviewNotes,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject registration (Admin only)' })
  async rejectRegistration(
    @Param('id') id: string,
    @Body() dto: ReviewRegistrationDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.registrationService.rejectRegistration(
      id,
      req.user.id,
      dto.reviewNotes,
    );
  }
}
