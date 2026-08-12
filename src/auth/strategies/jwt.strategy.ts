import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken() as (
      request: Request,
    ) => string | null;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
<<<<<<< HEAD
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
=======
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,

      secretOrKey: configService.get<string>('JWT_SECRET'),
>>>>>>> 2a75b99 (feat: implement advanced stream and wave scheduling)
    });
  }

  validate(payload: JwtPayload): { id: number; email: string; role: string } {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
