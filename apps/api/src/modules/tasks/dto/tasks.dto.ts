import { IsString, IsOptional, IsObject, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class LocationDataDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

class SocialProofDto {
  @IsString()
  platform: string;

  @IsOptional()
  @IsString()
  postUrl?: string;
}

export class CompleteTaskDto {
  @ApiPropertyOptional({ description: 'QR code for QR_SCAN tasks' })
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiPropertyOptional({ description: 'Survey responses for SURVEY tasks' })
  @IsOptional()
  @IsObject()
  surveyResponses?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Location data for CHECKIN tasks' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDataDto)
  locationData?: LocationDataDto;

  @ApiPropertyOptional({ description: 'Social proof for SOCIAL_SHARE tasks' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialProofDto)
  socialProof?: SocialProofDto;

  @ApiPropertyOptional({ description: 'Custom data for CUSTOM tasks' })
  @IsOptional()
  @IsObject()
  customData?: Record<string, unknown>;
}
