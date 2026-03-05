import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/user-current.decorator';

@Controller('api/v1/permissions')
@UseGuards(JwtGuard, PermissionGuard)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  // GET /api/v1/permissions?module=configuracion&submodule=usuarios
  @RequirePermission('configuracion', 'roles', 'ver')
  @Get()
  findAll(
    @CurrentUser('tenant_id') tenantId: string,
    @Query() query: { module?: string; submodule?: string },
  ) {
    return this.permissionsService.findAll(tenantId, query);
  }

  // GET /api/v1/permissions/grouped
  @RequirePermission('configuracion', 'roles', 'ver')
  @Get('grouped')
  findAllGrouped(@CurrentUser('tenant_id') tenantId: string) {
    return this.permissionsService.findAllGrouped(tenantId);
  }

  // GET /api/v1/permissions/:id
  @RequirePermission('configuracion', 'roles', 'ver')
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenant_id') tenantId: string,
  ) {
    return this.permissionsService.findOne(id, tenantId);
  }

  // POST /api/v1/permissions
  @RequirePermission('configuracion', 'roles', 'crear')
  @Post()
  create(
    @CurrentUser('tenant_id') tenantId: string,
    @Body() body: {
      module: string;
      submodule: string;
      action: string;
      description?: string;
    },
  ) {
    return this.permissionsService.create(tenantId, body);
  }

  // POST /api/v1/permissions/bulk
  @RequirePermission('configuracion', 'roles', 'crear')
  @Post('bulk')
  createBulk(
    @CurrentUser('tenant_id') tenantId: string,
    @Body() body: {
      permissions: {
        module: string;
        submodule: string;
        action: string;
        description?: string;
      }[];
    },
  ) {
    return this.permissionsService.createBulk(tenantId, body);
  }

  // PATCH /api/v1/permissions/:id
  @RequirePermission('configuracion', 'roles', 'editar')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('tenant_id') tenantId: string,
    @Body() body: { description?: string },
  ) {
    return this.permissionsService.update(id, tenantId, body);
  }

  // DELETE /api/v1/permissions/:id
  @RequirePermission('configuracion', 'roles', 'eliminar')
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('tenant_id') tenantId: string,
  ) {
    return this.permissionsService.remove(id, tenantId);
  }
}