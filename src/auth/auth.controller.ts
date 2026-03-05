import { Controller, Post, Get, Patch, Body, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/user-current.decorator';
import type { Request } from 'express';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ── PÚBLICOS ────────────────────────────────────────

  @Post('register')
  register(
    @Body() body: {
      email: string;
      username: string;
      password: string;
      first_name?: string;
      last_name?: string;
      tenant_id: string;
    },
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { email: string; password: string }, @Req() req: Request) {
    return this.authService.login({
      ...body,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Body() body: { refresh_token: string }) {
    return this.authService.refreshTokens(body.refresh_token);
  }

  // ── PROTEGIDOS (necesitan token) ────────────────────

  @UseGuards(JwtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() body: { refresh_token: string }) {
    return this.authService.logout(body.refresh_token);
  }

  @UseGuards(JwtGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  logoutAll(@CurrentUser('id') userId: string) {
    return this.authService.logoutAll(userId);
  }

  @UseGuards(JwtGuard)
  @Get('sessions')
  getSessions(@CurrentUser('id') userId: string) {
    return this.authService.getSessions(userId);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  // POST /api/v1/auth/forgot-password
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  // POST /api/v1/auth/verify-code
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  verifyResetCode(@Body() body: { email: string; code: string }) {
    return this.authService.verifyResetCode(body.email, body.code);
  }

  // POST /api/v1/auth/reset-password
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: { email: string; code: string; new_password: string }) {
    return this.authService.resetPassword(body.email, body.code, body.new_password);
  }
}