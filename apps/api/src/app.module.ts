import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Config
import { envConfig } from './config/env.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VenuesModule } from './modules/venues/venues.module';
import { QRModule } from './modules/qr/qr.module';
import { SponsorsModule } from './modules/sponsors/sponsors.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RolesModule } from './modules/roles/roles.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { ManageModule } from './modules/manage/manage.module';
import { PaymentsModule } from './modules/payments/payments.module';

// Common
import { PrismaModule } from './common/prisma/prisma.module';
import { I18nModule } from './common/i18n/i18n.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60000'),
        limit: parseInt(process.env.THROTTLE_LIMIT || '10'),
      },
    ]),

    // Common modules
    PrismaModule,
    I18nModule,

    // Feature modules
    AuthModule,
    UsersModule,
    VenuesModule,
    QRModule,
    SponsorsModule,
    TasksModule,
    RewardsModule,
    NotificationsModule,
    AnalyticsModule,
    RolesModule,
    UploadsModule,
    RegistrationModule,
    ManageModule,
    PaymentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
