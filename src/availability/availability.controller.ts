import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../doctor/dto/role.enum';
import { AvailabilityService } from './availability.service';
import { CreateCustomAvailabilityDto } from './dto/create-custom-availability.dto';
import { CreateRecurringAvailabilityDto } from './dto/create-recurring-availability.dto';
import { DateAvailabilityQueryDto } from './dto/date-availability-query.dto';
import { UpdateRecurringAvailabilityDto } from './dto/update-recurring-availability.dto';

type AuthenticatedUser = {
  id: number;
  email: string;
  role: Role;
};

@Controller('doctor/availability')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Doctor)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  createRecurring(
    @Request() req: { user: AuthenticatedUser },
    @Body() createAvailabilityDto: CreateRecurringAvailabilityDto,
  ) {
    return this.availabilityService.createRecurring(
      req.user.id,
      createAvailabilityDto,
    );
  }

  @Get('date')
  findForDate(
    @Request() req: { user: AuthenticatedUser },
    @Query() query: DateAvailabilityQueryDto,
  ) {
    return this.availabilityService.findForDate(req.user.id, query.date);
  }

  @Get()
  findRecurring(@Request() req: { user: AuthenticatedUser }) {
    return this.availabilityService.findRecurring(req.user.id);
  }

  @Patch(':id')
  updateRecurring(
    @Request() req: { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAvailabilityDto: UpdateRecurringAvailabilityDto,
  ) {
    return this.availabilityService.updateRecurring(
      req.user.id,
      id,
      updateAvailabilityDto,
    );
  }

  @Delete(':id')
  removeRecurring(
    @Request() req: { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.availabilityService.removeRecurring(req.user.id, id);
  }

  @Post('override')
  createCustomOverride(
    @Request() req: { user: AuthenticatedUser },
    @Body() createAvailabilityDto: CreateCustomAvailabilityDto,
  ) {
    return this.availabilityService.createCustomOverride(
      req.user.id,
      createAvailabilityDto,
    );
  }

  @Delete('override/:id')
  removeCustomOverride(
    @Request() req: { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.availabilityService.removeCustomOverride(req.user.id, id);
  }
}
