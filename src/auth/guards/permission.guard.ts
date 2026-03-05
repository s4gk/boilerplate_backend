import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Leer el permiso requerido del decorador @RequirePermission
    const requiredPermission = this.reflector.get<{
      module: string;
      submodule: string;
      action: string;
    }>('permission', context.getHandler());

    // Si no tiene @RequirePermission, dejar pasar
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Si no hay usuario (no pasó el JwtGuard), bloquear
    if (!user) {
      throw new ForbiddenException('No autenticado');
    }

    // Super admin tiene acceso a todo
    if (user.is_super_admin) {
      return true;
    }

    // Verificar el permiso usando la función de la BD
    const result = await this.prisma.$queryRaw<{ has_permission: boolean }[]>`
      SELECT tenant_user_has_permission(
        ${user.id}::uuid,
        ${user.tenant_id}::uuid,
        ${requiredPermission.module}::varchar,
        ${requiredPermission.submodule}::varchar,
        ${requiredPermission.action}::varchar
      ) as has_permission
    `;

    if (!result[0]?.has_permission) {
      throw new ForbiddenException(
        `No tienes permiso: ${requiredPermission.module}.${requiredPermission.submodule}.${requiredPermission.action}`,
      );
    }

    return true;
  }
}