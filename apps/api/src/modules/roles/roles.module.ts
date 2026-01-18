import { Module, Global } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesGuard } from './guards/roles.guard';
import { EntityAccessGuard } from './guards/entity-access.guard';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [RolesService, RolesGuard, EntityAccessGuard],
  exports: [RolesService, RolesGuard, EntityAccessGuard],
})
export class RolesModule {}
