import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const BASE_PERMISSIONS = [
  // Configuration > Users
  { module: 'configuracion', submodule: 'usuarios', action: 'ver' },
  { module: 'configuracion', submodule: 'usuarios', action: 'crear' },
  { module: 'configuracion', submodule: 'usuarios', action: 'editar' },
  { module: 'configuracion', submodule: 'usuarios', action: 'eliminar' },
  // Configuration > Roles
  { module: 'configuracion', submodule: 'roles', action: 'ver' },
  { module: 'configuracion', submodule: 'roles', action: 'crear' },
  { module: 'configuracion', submodule: 'roles', action: 'editar' },
  { module: 'configuracion', submodule: 'roles', action: 'eliminar' },
  // System > Audit
  { module: 'sistema', submodule: 'auditoria', action: 'ver' },
  // System > Settings
  { module: 'sistema', submodule: 'configuracion', action: 'ver' },
  { module: 'sistema', submodule: 'configuracion', action: 'editar' },
  // System > Notifications
  { module: 'sistema', submodule: 'notificaciones', action: 'ver' },
  { module: 'sistema', submodule: 'notificaciones', action: 'crear' },
  // System > Dashboard
  { module: 'sistema', submodule: 'dashboard', action: 'ver' },
  // System > Sessions
  { module: 'sistema', submodule: 'sesiones', action: 'ver' },
  { module: 'sistema', submodule: 'sesiones', action: 'eliminar' },
];

const DEFAULT_SETTINGS = [
  { key: 'company_name', value: process.env.COMPANY_NAME || 'Admin Panel', group: 'general', type: 'string' },
  { key: 'company_logo', value: '', group: 'general', type: 'string' },
  { key: 'timezone', value: 'UTC', group: 'general', type: 'string' },
  { key: 'currency', value: 'USD', group: 'general', type: 'string' },
  { key: 'date_format', value: 'YYYY-MM-DD', group: 'general', type: 'string' },
  { key: 'session_timeout_minutes', value: '30', group: 'security', type: 'number' },
  { key: 'require_2fa', value: 'false', group: 'security', type: 'boolean' },
  { key: 'max_login_attempts', value: '5', group: 'security', type: 'number' },
  { key: 'primary_color', value: '#1a1a2e', group: 'appearance', type: 'string' },
  { key: 'accent_color', value: '#e94560', group: 'appearance', type: 'string' },
];

// ─── DATOS DE RELLENO ──────────────────────────────────────────────

const AREAS = [
  'Tecnología',
  'Recursos Humanos',
  'Contabilidad',
  'Ventas',
  'Marketing',
  'Operaciones',
  'Legal',
  'Soporte',
];

const SEDES = [
  'Sede Principal - Bogotá',
  'Sede Norte - Medellín',
  'Sede Sur - Cali',
  'Sede Oriente - Bucaramanga',
];

const ROLES_DATA = [
  { name: 'Supervisor', description: 'Acceso de supervisión con permisos de lectura y edición', is_system: false },
  { name: 'Viewer', description: 'Acceso de solo lectura al sistema', is_system: false },
  { name: 'HR Manager', description: 'Gestión de recursos humanos y usuarios', is_system: false },
];

const USERS_DATA = [
  { email: 'carlos.martinez@app.com', username: 'cmartinez', first_name: 'Carlos', last_name: 'Martínez', phone: '+57 310 555 0001', document_type: 'CC', document_number: '1098765432', city: 'Bogotá', department: 'Cundinamarca', country: 'Colombia', blood_type: 'O+', eps: 'Sura', pension_fund: 'Porvenir' },
  { email: 'maria.lopez@app.com', username: 'mlopez', first_name: 'María', last_name: 'López', phone: '+57 311 555 0002', document_type: 'CC', document_number: '1087654321', city: 'Medellín', department: 'Antioquia', country: 'Colombia', blood_type: 'A+', eps: 'Nueva EPS', pension_fund: 'Protección' },
  { email: 'andres.garcia@app.com', username: 'agarcia', first_name: 'Andrés', last_name: 'García', phone: '+57 312 555 0003', document_type: 'CC', document_number: '1076543210', city: 'Cali', department: 'Valle del Cauca', country: 'Colombia', blood_type: 'B+', eps: 'Sanitas', pension_fund: 'Colfondos' },
  { email: 'laura.rodriguez@app.com', username: 'lrodriguez', first_name: 'Laura', last_name: 'Rodríguez', phone: '+57 313 555 0004', document_type: 'CC', document_number: '1065432109', city: 'Bucaramanga', department: 'Santander', country: 'Colombia', blood_type: 'AB+', eps: 'Compensar', pension_fund: 'Old Mutual' },
  { email: 'diego.hernandez@app.com', username: 'dhernandez', first_name: 'Diego', last_name: 'Hernández', phone: '+57 314 555 0005', document_type: 'CC', document_number: '1054321098', city: 'Bogotá', department: 'Cundinamarca', country: 'Colombia', blood_type: 'O-', eps: 'Sura', pension_fund: 'Porvenir' },
  { email: 'valentina.torres@app.com', username: 'vtorres', first_name: 'Valentina', last_name: 'Torres', phone: '+57 315 555 0006', document_type: 'CC', document_number: '1043210987', city: 'Medellín', department: 'Antioquia', country: 'Colombia', blood_type: 'A-', eps: 'Nueva EPS', pension_fund: 'Protección' },
  { email: 'santiago.ramirez@app.com', username: 'sramirez', first_name: 'Santiago', last_name: 'Ramírez', phone: '+57 316 555 0007', document_type: 'CC', document_number: '1032109876', city: 'Cali', department: 'Valle del Cauca', country: 'Colombia', blood_type: 'B-', eps: 'Sanitas', pension_fund: 'Colfondos' },
  { email: 'camila.morales@app.com', username: 'cmorales', first_name: 'Camila', last_name: 'Morales', phone: '+57 317 555 0008', document_type: 'CC', document_number: '1021098765', city: 'Bogotá', department: 'Cundinamarca', country: 'Colombia', blood_type: 'O+', eps: 'Compensar', pension_fund: 'Old Mutual' },
  { email: 'felipe.castro@app.com', username: 'fcastro', first_name: 'Felipe', last_name: 'Castro', phone: '+57 318 555 0009', document_type: 'CC', document_number: '1010987654', city: 'Bucaramanga', department: 'Santander', country: 'Colombia', blood_type: 'A+', eps: 'Sura', pension_fund: 'Porvenir' },
  { email: 'isabella.vargas@app.com', username: 'ivargas', first_name: 'Isabella', last_name: 'Vargas', phone: '+57 319 555 0010', document_type: 'CC', document_number: '1009876543', city: 'Medellín', department: 'Antioquia', country: 'Colombia', blood_type: 'AB-', eps: 'Nueva EPS', pension_fund: 'Protección' },
  // Usuarios inactivos para probar filtros
  { email: 'pedro.inactive@app.com', username: 'pinactive', first_name: 'Pedro', last_name: 'Inactivo', phone: '+57 320 555 0011', document_type: 'CC', document_number: '1001111111', city: 'Bogotá', department: 'Cundinamarca', country: 'Colombia', is_active: false },
  { email: 'ana.deleted@app.com', username: 'adeleted', first_name: 'Ana', last_name: 'Eliminada', phone: '+57 321 555 0012', document_type: 'CC', document_number: '1002222222', city: 'Cali', department: 'Valle del Cauca', country: 'Colombia', deleted: true },
];

const AUDIT_ACTIONS = ['crear', 'editar', 'eliminar', 'ver'];
const AUDIT_MODULES = [
  { module: 'configuracion', submodule: 'usuarios' },
  { module: 'configuracion', submodule: 'roles' },
  { module: 'sistema', submodule: 'configuracion' },
];

async function main() {
  const prisma = new PrismaClient();

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@app.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
    const defaultPassword = 'User123!@#';

    console.log('Seeding database...\n');

    // ─── 1. PERMISSIONS ────────────────────────────────────────
    for (const p of BASE_PERMISSIONS) {
      await prisma.permissions.upsert({
        where: {
          module_submodule_action: {
            module: p.module,
            submodule: p.submodule,
            action: p.action,
          },
        },
        update: {},
        create: {
          module: p.module,
          submodule: p.submodule,
          action: p.action,
          description: `${p.module}.${p.submodule}.${p.action}`,
        },
      });
    }
    console.log(`  Permissions: ${BASE_PERMISSIONS.length} created/verified`);

    // ─── 2. ROLES ──────────────────────────────────────────────
    // Administrator role
    let adminRole = await prisma.roles.findFirst({ where: { name: 'Administrator' } });
    if (!adminRole) {
      adminRole = await prisma.roles.create({
        data: { name: 'Administrator', description: 'Full system access role', is_system: true },
      });
    }

    // Assign all permissions to Administrator
    const allPermissions = await prisma.permissions.findMany({ select: { id: true } });
    await prisma.role_permissions.createMany({
      data: allPermissions.map((p) => ({ role_id: adminRole!.id, permission_id: p.id })),
      skipDuplicates: true,
    });

    // Additional roles
    const createdRoles: Record<string, string> = { Administrator: adminRole.id };
    for (const r of ROLES_DATA) {
      let role = await prisma.roles.findFirst({ where: { name: r.name } });
      if (!role) {
        role = await prisma.roles.create({ data: r });
      }
      createdRoles[r.name] = role.id;
    }

    // Assign view-only permissions to Viewer role
    const viewPermissions = await prisma.permissions.findMany({
      where: { action: 'ver' },
      select: { id: true },
    });
    await prisma.role_permissions.createMany({
      data: viewPermissions.map((p) => ({ role_id: createdRoles['Viewer'], permission_id: p.id })),
      skipDuplicates: true,
    });

    // Assign configuracion.usuarios.* + view permissions to Supervisor
    const supervisorPerms = await prisma.permissions.findMany({
      where: {
        OR: [
          { module: 'configuracion', submodule: 'usuarios' },
          { action: 'ver' },
        ],
      },
      select: { id: true },
    });
    await prisma.role_permissions.createMany({
      data: supervisorPerms.map((p) => ({ role_id: createdRoles['Supervisor'], permission_id: p.id })),
      skipDuplicates: true,
    });

    // Assign user management perms to HR Manager
    const hrPerms = await prisma.permissions.findMany({
      where: {
        OR: [
          { module: 'configuracion', submodule: 'usuarios' },
          { action: 'ver' },
          { module: 'sistema', submodule: 'notificaciones' },
        ],
      },
      select: { id: true },
    });
    await prisma.role_permissions.createMany({
      data: hrPerms.map((p) => ({ role_id: createdRoles['HR Manager'], permission_id: p.id })),
      skipDuplicates: true,
    });

    console.log(`  Roles: ${Object.keys(createdRoles).length} created/verified (Administrator, Supervisor, Viewer, HR Manager)`);

    // ─── 3. AREAS & SEDES ──────────────────────────────────────
    const areaIds: string[] = [];
    for (const name of AREAS) {
      const area = await prisma.areas.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      areaIds.push(area.id);
    }

    const sedeIds: string[] = [];
    for (const name of SEDES) {
      const sede = await prisma.sedes.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      sedeIds.push(sede.id);
    }
    console.log(`  Areas: ${AREAS.length} | Sedes: ${SEDES.length}`);

    // ─── 4. ADMIN USER ─────────────────────────────────────────
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    let adminUser = await prisma.users.findUnique({ where: { email: adminEmail } });
    if (!adminUser) {
      adminUser = await prisma.users.create({
        data: {
          email: adminEmail,
          username: 'admin',
          password_hash: passwordHash,
          first_name: 'Super',
          last_name: 'Admin',
          is_super_admin: true,
          is_active: true,
          is_verified: true,
          area_id: areaIds[0],
        },
      });
      await prisma.user_roles.create({
        data: { user_id: adminUser.id, role_id: adminRole.id, assigned_by: adminUser.id },
      });
      await prisma.user_sedes.create({
        data: { user_id: adminUser.id, sede_id: sedeIds[0] },
      });
    }
    console.log(`  Admin: ${adminEmail}`);

    // ─── 5. SAMPLE USERS ───────────────────────────────────────
    const userPasswordHash = await bcrypt.hash(defaultPassword, 12);
    const createdUserIds: string[] = [adminUser.id];
    const roleNames = ['Supervisor', 'Viewer', 'HR Manager'];

    for (let i = 0; i < USERS_DATA.length; i++) {
      const u = USERS_DATA[i];
      const isDeleted = 'deleted' in u && u.deleted;
      const isActive = 'is_active' in u ? u.is_active : true;

      let user = await prisma.users.findUnique({ where: { email: u.email } });
      if (!user) {
        const daysAgo = Math.floor(Math.random() * 60) + 1;
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        user = await prisma.users.create({
          data: {
            email: u.email,
            username: u.username,
            password_hash: userPasswordHash,
            first_name: u.first_name,
            last_name: u.last_name,
            phone: u.phone,
            document_type: u.document_type || null,
            document_number: u.document_number || null,
            city: u.city,
            department: u.department,
            country: u.country || 'Colombia',
            blood_type: u.blood_type || null,
            eps: u.eps || null,
            pension_fund: u.pension_fund || null,
            area_id: areaIds[i % areaIds.length],
            hire_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            is_active: isActive !== false,
            is_verified: true,
            deleted_at: isDeleted ? new Date() : null,
            created_at: createdAt,
          },
        });

        // Assign a role (rotate through roles)
        const roleName = roleNames[i % roleNames.length];
        await prisma.user_roles.create({
          data: {
            user_id: user.id,
            role_id: createdRoles[roleName],
            assigned_by: adminUser.id,
          },
        });

        // Assign to a sede
        await prisma.user_sedes.create({
          data: {
            user_id: user.id,
            sede_id: sedeIds[i % sedeIds.length],
            area_id: areaIds[i % areaIds.length],
          },
        });
      }
      createdUserIds.push(user.id);
    }
    console.log(`  Users: ${USERS_DATA.length} sample users created`);

    // ─── 6. AUDIT LOGS ─────────────────────────────────────────
    const auditEntries: {
      user_id: string;
      module: string;
      submodule: string;
      action: string;
      ip_address: string;
      user_agent: string;
      created_at: Date;
    }[] = [];

    const ips = ['192.168.1.10', '192.168.1.25', '10.0.0.5', '172.16.0.100'];
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605',
      'Mozilla/5.0 (X11; Linux x86_64) Firefox/121',
    ];

    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(Math.floor(Math.random() * 14) + 7); // 7am-9pm
      createdAt.setMinutes(Math.floor(Math.random() * 60));

      const modInfo = AUDIT_MODULES[Math.floor(Math.random() * AUDIT_MODULES.length)];
      auditEntries.push({
        user_id: createdUserIds[Math.floor(Math.random() * Math.min(createdUserIds.length, 5))],
        module: modInfo.module,
        submodule: modInfo.submodule,
        action: AUDIT_ACTIONS[Math.floor(Math.random() * AUDIT_ACTIONS.length)],
        ip_address: ips[Math.floor(Math.random() * ips.length)],
        user_agent: userAgents[Math.floor(Math.random() * userAgents.length)],
        created_at: createdAt,
      });
    }

    await prisma.audit_log.createMany({ data: auditEntries, skipDuplicates: true });
    console.log(`  Audit logs: ${auditEntries.length} entries`);

    // ─── 7. LOGIN ATTEMPTS ─────────────────────────────────────
    const loginAttempts: {
      email: string;
      ip_address: string;
      user_agent: string;
      success: boolean;
      failure_reason: string | null;
      created_at: Date;
    }[] = [];

    const emails = [adminEmail, ...USERS_DATA.slice(0, 5).map((u) => u.email)];

    for (let i = 0; i < 80; i++) {
      const daysAgo = Math.floor(Math.random() * 14);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(Math.floor(Math.random() * 16) + 6);
      createdAt.setMinutes(Math.floor(Math.random() * 60));

      const success = Math.random() > 0.25; // 75% success rate
      loginAttempts.push({
        email: emails[Math.floor(Math.random() * emails.length)],
        ip_address: ips[Math.floor(Math.random() * ips.length)],
        user_agent: userAgents[Math.floor(Math.random() * userAgents.length)],
        success,
        failure_reason: success ? null : ['invalid_password', 'account_locked', 'account_inactive'][Math.floor(Math.random() * 3)],
        created_at: createdAt,
      });
    }

    await prisma.login_attempts.createMany({ data: loginAttempts, skipDuplicates: true });
    console.log(`  Login attempts: ${loginAttempts.length} entries`);

    // ─── 8. NOTIFICATIONS ──────────────────────────────────────
    const notificationTemplates = [
      { title: 'Bienvenido al sistema', message: 'Tu cuenta ha sido creada exitosamente. Configura tu perfil.', type: 'info' },
      { title: 'Nuevo rol asignado', message: 'Se te ha asignado un nuevo rol en el sistema.', type: 'info' },
      { title: 'Contraseña actualizada', message: 'Tu contraseña fue cambiada exitosamente.', type: 'success' },
      { title: 'Intento de login sospechoso', message: 'Se detectó un intento de inicio de sesión desde una IP desconocida.', type: 'warning' },
      { title: 'Mantenimiento programado', message: 'El sistema estará en mantenimiento el próximo domingo de 2:00 AM a 5:00 AM.', type: 'warning' },
      { title: 'Actualización del sistema', message: 'Se han implementado mejoras de rendimiento y seguridad.', type: 'info' },
      { title: 'Error en exportación', message: 'La exportación de datos del reporte mensual falló. Intenta nuevamente.', type: 'error' },
      { title: 'Sesión cerrada', message: 'Tu sesión fue cerrada por inactividad.', type: 'info' },
    ];

    const notifications: {
      user_id: string;
      title: string;
      message: string;
      type: string;
      read_at: Date | null;
      created_at: Date;
    }[] = [];

    // Create notifications for the first 6 users (including admin)
    for (let userIdx = 0; userIdx < Math.min(6, createdUserIds.length); userIdx++) {
      const numNotifications = Math.floor(Math.random() * 5) + 3;
      for (let j = 0; j < numNotifications; j++) {
        const template = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
        const daysAgo = Math.floor(Math.random() * 15);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        const isRead = Math.random() > 0.4; // 60% read
        const readAt = isRead ? new Date(createdAt.getTime() + Math.random() * 86400000) : null;

        notifications.push({
          user_id: createdUserIds[userIdx],
          title: template.title,
          message: template.message,
          type: template.type,
          read_at: readAt,
          created_at: createdAt,
        });
      }
    }

    await prisma.notifications.createMany({ data: notifications, skipDuplicates: true });
    console.log(`  Notifications: ${notifications.length} entries`);

    // ─── 9. SETTINGS ───────────────────────────────────────────
    for (const s of DEFAULT_SETTINGS) {
      await prisma.settings.upsert({
        where: { key: s.key },
        update: {},
        create: s,
      });
    }
    console.log(`  Settings: ${DEFAULT_SETTINGS.length} created/verified`);

    // ─── SUMMARY ───────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════');
    console.log('  Seed completed successfully!');
    console.log('══════════════════════════════════════════');
    console.log(`\n  Admin login:`);
    console.log(`    Email:    ${adminEmail}`);
    console.log(`    Password: ${adminPassword}`);
    console.log(`\n  Sample users password: ${defaultPassword}`);
    console.log(`\n  Sample user emails:`);
    USERS_DATA.filter((u) => !('deleted' in u) && !('is_active' in u && !u.is_active)).forEach((u) => {
      console.log(`    - ${u.email}`);
    });
    console.log('');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});
