import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const ENTITY_TYPE_KEY = 'entityType';
export const ENTITY_ID_PARAM_KEY = 'entityIdParam';

export interface EntityAccessOptions {
  entityType: 'VENUE' | 'EVENT' | 'BRAND';
  idParam: string; // Name of the route parameter containing the entity ID
}

export const EntityAccess = (options: EntityAccessOptions) =>
  SetMetadata('entityAccess', options);
