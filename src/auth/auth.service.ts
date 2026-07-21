import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from './enums/role.enum';

// 1. We define a strict Interface so TypeScript knows exactly what a "User" looks like
interface User {
  id: number;
  email: string;
  pass: string;
  role: Role;
}

@Injectable()
export class AuthService {
  // 2. We apply that Interface to our array. 
  // Now TypeScript knows this is an array of User objects, not 'never'.
  private users: User[] = [];

  constructor(private jwtService: JwtService) {}

  signup(email: string, pass: string, role: Role) {
    const newUser: User = { id: this.users.length + 1, email, pass, role };
    this.users.push(newUser);
    return { message: 'User registered successfully', user: { email, role } };
  }

  login(email: string, pass: string) {
    const user = this.users.find(u => u.email === email && u.pass === pass);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Generate the JWT token containing the user's ID, Email, and Role
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}