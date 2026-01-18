import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PaymentsService } from './payments.service';
import { PaymentsController, VenuePaymentConfigController } from './payments.controller';
import { MercadoPagoProvider } from './providers/mercado-pago.provider';
import { StripeConnectProvider } from './providers/stripe-connect.provider';
import { BankTransferProvider } from './providers/bank-transfer.provider';
import { NFCPaymentProvider } from './providers/nfc-payment.provider';
import { MockPaymentProvider } from './providers/mock.provider';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PaymentsController, VenuePaymentConfigController],
  providers: [
    PaymentsService,
    MercadoPagoProvider,
    StripeConnectProvider,
    BankTransferProvider,
    NFCPaymentProvider,
    MockPaymentProvider,
  ],
  exports: [PaymentsService, NFCPaymentProvider],
})
export class PaymentsModule {}
