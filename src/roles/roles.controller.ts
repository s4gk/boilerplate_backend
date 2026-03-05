import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/user-current.decorator';

@Controller('api/v1/roles')
@UseGuards(JwtGuard, PermissionGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  // GET /api/v1/roles
  @RequirePermission('configuracion', 'roles', 'ver')
  @Get()
  findAll(
    @CurrentUser('tenant_id') tenantId: string,
    @Query() query: { is_active?: string },
  ) {
    return this.rolesService.findAll(tenantId, {
      is_active: query.is_active ? query.is_active === 'true' : undefined,
    });
  }

  // GET /api/v1/roles/:id
  @RequirePermission('configuracion', 'roles', 'ver')
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenant_id') tenantId: string,
  ) {
    return this.rolesService.findOne(id, tenantId);
  }

  // POST /api/v1/roles
  @RequirePermission('configuracion', 'roles', 'crear')
  @Post()
  create(
    @CurrentUser('tenant_id') tenantId: string,
    @Body() body: {
      name: string;
      description?: string;
      parent_role_id?: string;
      permission_ids?: string[];
    },
  ) {
    return this.rolesService.create(tenantId, body);
  }

  // PATCH /api/v1/roles/:id
  @RequirePermission('configuracion', 'roles', 'editar')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('tenant_id') tenantId: string,
    @Body() body: {
      name?: string;
      description?: string;
      is_active?: boolean;
      parent_role_id?: string;
    },
  ) {
    return this.rolesService.update(id, tenantId, body);
  }

  // DELETE /api/v1/roles/:id
  @RequirePermission('configuracion', 'roles', 'eliminar')
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('tenant_id') tenantId: string,
  ) {
    return this.rolesService.remove(id, tenantId);
  }

  // GET /api/v1/roles/:id/permissions
  @RequirePermission('configuracion', 'roles', 'ver')
  @Get(':id/permissions')
  getRolePermissions(
    @Param('id') id: string,
    @CurrentUser('tenant_id') tenantId: string,
  ) {
    return this.rolesService.getRolePermissions(id, tenantId);
  }

  // POST /api/v1/roles/:id/permissions
  @RequirePermission('configuracion', 'roles', 'editar')
  @Post(':id/permissions')
  assignPermissions(
    @Param('id') id: string,
    @CurrentUser('tenant_id') tenantId: string,
    @Body() body: { permission_ids: string[] },
  ) {
    return this.rolesService.assignPermissions(id, tenantId, body);
  }

  // DELETE /api/v1/roles/:id/permissions/:permissionId
  @RequirePermission('configuracion', 'roles', 'editar')
  @Delete(':id/permissions/:permissionId')
  removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser('tenant_id') tenantId: string,
  ) {
    return this.rolesService.removePermission(id, permissionId, tenantId);
  }

  // GET /api/v1/roles/:id/users
  @RequirePermission('configuracion', 'roles', 'ver')
  @Get(':id/users')
  getRoleUsers(
    @Param('id') id: string,
    @CurrentUser('tenant_id') tenantId: string,
  ) {
    return this.rolesService.getRoleUsers(id, tenantId);
  }
}