import { Controller, Get, Post, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('doctor') // The base route is /doctor
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DOCTOR') // Protects all routes in this controller for DOCTOR only
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  // Maps to POST /doctor/profile
  @Post('profile')
  create(@Request() req, @Body() createDoctorDto: CreateDoctorProfileDto) {
    return this.doctorService.create(req.user.userId, createDoctorDto);
  }

  // Maps to GET /doctor/profile
  @Get('profile')
  findOne(@Request() req) {
    return this.doctorService.findOne(req.user.userId);
  }

  // Maps to PATCH /doctor/profile
  @Patch('profile')
  update(@Request() req, @Body() updateDoctorDto: UpdateDoctorProfileDto) {
    return this.doctorService.update(req.user.userId, updateDoctorDto);
  }
}