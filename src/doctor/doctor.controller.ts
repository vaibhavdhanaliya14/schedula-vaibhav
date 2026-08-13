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
import { DoctorService } from './doctor.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { Role } from './dto/role.enum';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

type User = {
  id: number;
  email: string;
  role: Role;
};

@Controller('doctor/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Doctor)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  create(
    @Request() req: { user: User },
    @Body() createDoctorProfileDto: CreateDoctorProfileDto,
  ) {
    const userId = req.user.id;
    return this.doctorService.create(userId, createDoctorProfileDto);
  }

  @Get()
  findOne(@Request() req: { user: User }) {
    const userId = req.user.id;
    return this.doctorService.findOne(userId);
  }

  @Patch()
  update(
    @Request() req: { user: User },
    @Body() updateDoctorProfileDto: UpdateDoctorProfileDto,
  ) {
    const userId = req.user.id;
    return this.doctorService.update(userId, updateDoctorProfileDto);
  }
}
