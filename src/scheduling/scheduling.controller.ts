import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../doctor/dto/role.enum';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { SchedulingService } from './scheduling.service';

type RequestUser = {
  id: number;
  email: string;
  role: Role;
};

@Controller('scheduling')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('doctor/schedules')
  @Roles(Role.Doctor)
  createDoctorSchedule(
    @Request() req: { user: RequestUser },
    @Body() createScheduleDto: CreateScheduleDto,
  ) {
    return this.schedulingService.createDoctorSchedule(
      req.user.id,
      createScheduleDto,
    );
  }

  @Get('doctors/:doctorId/availability')
  @Roles(Role.Patient, Role.Doctor)
  getDoctorAvailability(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.schedulingService.getDoctorAvailability(doctorId);
  }

  @Post('patient/bookings')
  @Roles(Role.Patient)
  bookAppointment(
    @Request() req: { user: RequestUser },
    @Body() bookAppointmentDto: BookAppointmentDto,
  ) {
    return this.schedulingService.bookAppointment(
      req.user.id,
      bookAppointmentDto,
    );
  }

  @Get('patient/appointments')
  @Roles(Role.Patient)
  getPatientAppointments(@Request() req: { user: RequestUser }) {
    return this.schedulingService.getPatientAppointments(req.user.id);
  }

  @Get('appointments/my')
  @Roles(Role.Patient)
  getMyAppointments(@Request() req: { user: RequestUser }) {
    return this.schedulingService.getPatientAppointments(req.user.id);
  }

  @Get('doctor/appointments')
  @Roles(Role.Doctor)
  getDoctorAppointments(@Request() req: { user: RequestUser }) {
    return this.schedulingService.getDoctorAppointments(req.user.id);
  }

  @Patch('appointments/:appointmentId/cancel')
  @Roles(Role.Patient)
  cancelAppointment(
    @Request() req: { user: RequestUser },
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
  ) {
    return this.schedulingService.cancelAppointment(req.user.id, appointmentId);
  }

  @Patch('patient/appointments/:appointmentId/cancel')
  @Roles(Role.Patient)
  cancelPatientAppointment(
    @Request() req: { user: RequestUser },
    @Param('appointmentId', ParseIntPipe) appointmentId: number,
  ) {
    return this.schedulingService.cancelAppointment(req.user.id, appointmentId);
  }
}
