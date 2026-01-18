import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimRewardDto {
  @ApiProperty({ description: 'ID of the completed quest' })
  @IsString()
  questId: string;

  @ApiProperty({ description: 'ID of the venue to claim at' })
  @IsString()
  venueId: string;
}
