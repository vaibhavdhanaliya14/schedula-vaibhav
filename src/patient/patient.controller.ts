import { Controller, Get, Post, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('patient/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PATIENT') // Only patients can access these routes
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  create(@Request() req, @Body() createPatientDto: CreatePatientProfileDto) {
    return this.patientService.create(req.user.userId, createPatientDto);
  }

  @Get()
  findOne(@Request() req) {
    return this.patientService.findOne(req.user.userId);
  }

  @Patch()
  update(@Request() req, @Body() updatePatientDto: UpdatePatientProfileDto) {
    return this.patientService.update(req.user.userId, updatePatientDto);
  }
}