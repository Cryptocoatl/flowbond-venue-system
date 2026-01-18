import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RewardsService } from './rewards.service';
import { ClaimRewardDto } from './dto/rewards.dto';

@ApiTags('rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private rewardsService: RewardsService) {}

  @Post('claim')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim a drink reward after completing a quest' })
  @ApiResponse({ status: 201, description: 'Drink pass created' })
  @ApiResponse({ status: 400, description: 'Quest not completed' })
  @ApiResponse({ status: 409, description: 'Already have active pass' })
  async claimReward(
    @Request() req: { user: { id: string } },
    @Body() dto: ClaimRewardDto,
  ) {
    return this.rewardsService.claimReward(req.user.id, dto.questId, dto.venueId);
  }

  @Get('passes')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's drink passes" })
  @ApiResponse({ status: 200, description: 'List of drink passes' })
  async getUserPasses(@Request() req: { user: { id: string } }) {
    return this.rewardsService.getUserPasses(req.user.id);
  }

  @Get('passes/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get drink pass details' })
  @ApiResponse({ status: 200, description: 'Drink pass details' })
  @ApiResponse({ status: 404, description: 'Pass not found' })
  async getPass(@Param('id') id: string) {
    return this.rewardsService.getActivePass(id);
  }

  @Get('verify/:code')
  @ApiOperation({ summary: 'Verify a drink pass by code (for staff)' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  @ApiResponse({ status: 404, description: 'Pass not found' })
  async verifyPass(@Param('code') code: string) {
    return this.rewardsService.verifyPass(code);
  }

  @Post('redeem/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Redeem a drink pass (staff only)' })
  @ApiResponse({ status: 200, description: 'Pass redeemed' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 409, description: 'Already redeemed' })
  async redeemPass(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.rewardsService.redeemPass(id, req.user.id);
  }

  @Post('cancel/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a drink pass' })
  @ApiResponse({ status: 200, description: 'Pass cancelled' })
  @ApiResponse({ status: 403, description: 'Not your pass' })
  async cancelPass(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.rewardsService.cancelPass(id, req.user.id);
  }
}
