import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'schedula-super-secret-key', // In production, this goes in a .env file!
    });
  }

  async validate(payload: any) {
    // This payload is extracted from the valid JWT
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}