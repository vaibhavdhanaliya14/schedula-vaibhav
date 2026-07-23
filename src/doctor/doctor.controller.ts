import { Controller, Get, Post, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('doctor/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DOCTOR') // Only doctors can access these routes
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  create(@Request() req, @Body() createDoctorDto: CreateDoctorProfileDto) {
    // req.user comes from your Day 2 JWT Strategy
    return this.doctorService.create(req.user.userId, createDoctorDto);
  }

  @Get()
  findOne(@Request() req) {
    return this.doctorService.findOne(req.user.userId);
  }

  @Patch()
  update(@Request() req, @Body() updateDoctorDto: UpdateDoctorProfileDto) {
    return this.doctorService.update(req.user.userId, updateDoctorDto);
  }
}