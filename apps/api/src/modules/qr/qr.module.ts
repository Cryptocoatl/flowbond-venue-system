import { Module } from '@nestjs/common';
import { QRController } from './qr.controller';
import { QRService } from './qr.service';
import { VenuesModule } from '../venues/venues.module';

@Module({
  imports: [VenuesModule],
  controllers: [QRController],
  providers: [QRService],
  exports: [QRService],
})
export class QRModule {}
