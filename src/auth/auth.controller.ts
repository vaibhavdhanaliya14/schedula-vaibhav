import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from '../doctor/dto/signup.dto';
import { LoginDto } from '../doctor/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(
      signUpDto.email,
      signUpDto.pass,
      signUpDto.role,
    );
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.pass);
  }
}
