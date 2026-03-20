import { SetMetadata } from '@nestjs/common';

// Este decorador marca un endpoint con el permiso requerido
// Uso: @RequirePermission('configuracion', 'usuarios', 'ver')
export const RequirePermission = (
  module: string,
  submodule: string,
  action: string,
) => SetMetadata('permission', { module, submodule, action });
