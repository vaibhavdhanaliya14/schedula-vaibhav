import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../doctor/dto/role.enum';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { PatientService } from './patient.service';

type User = {
  id: number;
  email: string;
  role: Role;
};

@Controller('patient/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Patient)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  create(
    @Request() req: { user: User },
    @Body() createPatientProfileDto: CreatePatientProfileDto,
  ) {
    const userId = req.user.id;
    return this.patientService.create(userId, createPatientProfileDto);
  }

  @Get()
  findOne(@Request() req: { user: User }) {
    const userId = req.user.id;
    return this.patientService.findOne(userId);
  }

  @Patch()
  update(
    @Request() req: { user: User },
    @Body() updatePatientProfileDto: UpdatePatientProfileDto,
  ) {
    const userId = req.user.id;
    return this.patientService.update(userId, updatePatientProfileDto);
  }
}
