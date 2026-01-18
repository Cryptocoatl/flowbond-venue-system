import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntityType } from '@prisma/client';
import { EntityAccessOptions } from '../decorators/roles.decorator';
import { RolesService } from '../roles.service';

@Injectable()
export class EntityAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const entityAccess = this.reflector.get<EntityAccessOptions>(
      'entityAccess',
      context.getHandler(),
    );

    if (!entityAccess) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check legacy admin flag
    if (user.isAdmin) {
      return true;
    }

    const entityId = request.params[entityAccess.idParam];

    if (!entityId) {
      throw new NotFoundException(`${entityAccess.entityType} not found`);
    }

    const entityType = entityAccess.entityType as EntityType;
    const canAccess = await this.rolesService.canAccessEntity(
      user.id,
      entityType,
      entityId,
    );

    if (!canAccess) {
      throw new ForbiddenException(
        `You do not have access to this ${entityAccess.entityType.toLowerCase()}`,
      );
    }

    return true;
  }
}
