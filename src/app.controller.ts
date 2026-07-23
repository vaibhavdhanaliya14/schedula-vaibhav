import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { Role } from './auth/enums/role.enum';

@Controller()
export class AppController {

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @Get('doctor/profile')
  getDoctorProfile(@Request() req) {
    return { message: 'Welcome to the Doctor Dashboard', user: req.user };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @Get('patient/profile')
  getPatientProfile(@Request() req) {
    return { message: 'Welcome to the Patient Dashboard', user: req.user };
  }
}
