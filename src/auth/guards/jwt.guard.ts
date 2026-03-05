import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  // Este método se ejecuta ANTES de cada request protegido
  // Si retorna true, el request pasa. Si retorna false o lanza error, se bloquea.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Sacar el token del header Authorization: Bearer <token>
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verificar y decodificar el JWT
      const payload = this.jwtService.verify(token);

      // Meter los datos del usuario en el request para usarlos después
      request.user = {
        id: payload.sub,
        tenant_id: payload.tenant_id,
        is_super_admin: payload.is_super_admin,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}