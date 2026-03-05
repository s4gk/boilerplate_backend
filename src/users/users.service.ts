import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ─── LISTAR USUARIOS ──────────────────────────────────
  // Lista usuarios del tenant con paginación y búsqueda
  async findAll(tenant_id: string, query: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Construir filtros dinámicamente
    const where: any = { tenant_id };

    if (query.is_active !== undefined) {
      where.is_active = query.is_active;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
        { first_name: { contains: query.search, mode: 'insensitive' } },
        { last_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Ejecutar consulta y conteo en paralelo
    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          is_active: true,
          is_verified: true,
          last_login_at: true,
          created_at: true,
          user_roles: {
            include: {
              role: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.users.count({ where }),
    ]);

    // Formatear la respuesta
    const formatted = users.map((user) => ({
      ...user,
      roles: user.user_roles.map((ur) => ur.role),
      user_roles: undefined,
    }));

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // ─── OBTENER UN USUARIO ────────────────────────────────
  async findOne(id: string, tenant_id: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, tenant_id },
      select: {
        id: true,
        email: true,
        username: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        is_active: true,
        is_verified: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
        user_roles: {
          include: {
            role: {
              select: { id: true, name: true, description: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      ...user,
      roles: user.user_roles.map((ur) => ur.role),
      user_roles: undefined,
    };
  }

  // ─── CREAR USUARIO ─────────────────────────────────────
  // Crea un usuario y opcionalmente le asigna roles
  async create(tenant_id: string, data: {
    email: string;
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role_ids?: string[];
  }, assigned_by: string) {
    // Verificar que no exista el email o username
    const existing = await this.prisma.users.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    });

    if (existing) {
      throw new ConflictException(
        existing.email === data.email
          ? 'El email ya está registrado'
          : 'El username ya está en uso',
      );
    }

    const password_hash = await bcrypt.hash(data.password, 12);

    // Crear usuario y asignar roles en una transacción
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          tenant_id,
          email: data.email,
          username: data.username,
          password_hash,
          first_name: data.first_name,
          last_name: data.last_name,
        },
        select: {
          id: true,
          email: true,
          username: true,
          first_name: true,
          last_name: true,
          is_active: true,
          created_at: true,
        },
      });

      // Asignar roles si se enviaron
      if (data.role_ids && data.role_ids.length > 0) {
        await tx.user_roles.createMany({
          data: data.role_ids.map((role_id) => ({
            user_id: newUser.id,
            role_id,
            assigned_by,
          })),
        });
      }

      return newUser;
    });

    return user;
  }

  // ─── ACTUALIZAR USUARIO ────────────────────────────────
  async update(id: string, tenant_id: string, data: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    is_active?: boolean;
  }) {
    // Verificar que el usuario existe y pertenece al tenant
    const user = await this.prisma.users.findFirst({
      where: { id, tenant_id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.prisma.users.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        is_active: true,
        updated_at: true,
      },
    });
  }

  // ─── ELIMINAR USUARIO ──────────────────────────────────
  async remove(id: string, tenant_id: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, tenant_id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.prisma.users.delete({ where: { id } });

    return { message: 'Usuario eliminado exitosamente' };
  }

  // ─── ROLES DEL USUARIO ─────────────────────────────────
  // Obtener los roles de un usuario
  async getUserRoles(id: string, tenant_id: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, tenant_id },
      select: {
        user_roles: {
          include: {
            role: { select: { id: true, name: true, description: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user.user_roles.map((ur) => ({
      ...ur.role,
      assigned_at: ur.assigned_at,
      expires_at: ur.expires_at,
    }));
  }

  // ─── ASIGNAR ROLES ─────────────────────────────────────
  async assignRoles(id: string, tenant_id: string, data: {
    role_ids: string[];
    expires_at?: string;
  }, assigned_by: string) {
    // Verificar que el usuario existe
    const user = await this.prisma.users.findFirst({
      where: { id, tenant_id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que los roles pertenecen al mismo tenant
    const roles = await this.prisma.roles.findMany({
      where: {
        id: { in: data.role_ids },
        tenant_id,
        is_active: true,
      },
    });

    if (roles.length !== data.role_ids.length) {
      throw new NotFoundException('Uno o más roles no encontrados en este tenant');
    }

    // Crear las asignaciones ignorando duplicados
    await this.prisma.user_roles.createMany({
      data: data.role_ids.map((role_id) => ({
        user_id: id,
        role_id,
        assigned_by,
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
      })),
      skipDuplicates: true,
    });

    return { message: 'Roles asignados exitosamente' };
  }

  // ─── QUITAR ROL ────────────────────────────────────────
  async removeRole(user_id: string, role_id: string, tenant_id: string) {
    const user = await this.prisma.users.findFirst({
      where: { id: user_id, tenant_id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.prisma.user_roles.delete({
      where: {
        user_id_role_id: { user_id, role_id },
      },
    });

    return { message: 'Rol removido exitosamente' };
  }

  // ─── PERMISOS DEL USUARIO ──────────────────────────────
  async getUserPermissions(id: string, tenant_id: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, tenant_id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Usar la función de la BD que ya maneja herencia
    const permissions = await this.prisma.$queryRaw`
      SELECT * FROM get_tenant_user_permissions(${id}::uuid, ${tenant_id}::uuid)
    ` as { permission_id: string; module: string; submodule: string; action: string }[];

    return permissions.map((p) => ({
      id: p.permission_id,
      module: p.module,
      submodule: p.submodule,
      action: p.action,
      full: `${p.module}.${p.submodule}.${p.action}`,
    }));
  }
}