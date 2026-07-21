import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from './enums/role.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: { email: string; pass: string; role: Role }) {
    return this.authService.signup(body.email, body.pass, body.role);
  }

  @Post('login')
  login(@Body() body: { email: string; pass: string }) {
    return this.authService.login(body.email, body.pass);
  }
}