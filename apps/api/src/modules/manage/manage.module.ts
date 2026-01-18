import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';
import { ManageVenuesController } from './manage-venues.controller';
import { ManageEventsController } from './manage-events.controller';
import { ManageBrandsController } from './manage-brands.controller';
import { ManageMenuController } from './manage-menu.controller';
import { ManageOrdersController, OrdersController } from './manage-orders.controller';
import { ManageService } from './manage.service';
import { MenuService } from './menu.service';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule, RolesModule],
  controllers: [
    ManageVenuesController,
    ManageEventsController,
    ManageBrandsController,
    ManageMenuController,
    ManageOrdersController,
    OrdersController,
  ],
  providers: [ManageService, MenuService, OrdersService],
  exports: [ManageService, MenuService, OrdersService],
})
export class ManageModule {}
