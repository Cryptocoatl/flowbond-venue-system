import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QRService } from './qr.service';

@ApiTags('qr')
@Controller('qr')
export class QRController {
  constructor(private qrService: QRService) {}

  @Get('resolve/:code')
  @ApiOperation({ summary: 'Resolve QR code to context' })
  @ApiResponse({
    status: 200,
    description: 'QR code resolved with venue, zone, and quest context',
  })
  @ApiResponse({ status: 404, description: 'QR code not found' })
  async resolveQRCode(@Param('code') code: string) {
    return this.qrService.resolveQRCode(code);
  }
}
