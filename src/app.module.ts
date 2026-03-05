import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, RolesModule, PermissionsModule, EmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
