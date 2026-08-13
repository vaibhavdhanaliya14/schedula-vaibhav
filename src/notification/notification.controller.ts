import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../doctor/dto/role.enum';
import { NotificationService } from './notification.service';

type User = {
  id: number;
  email: string;
  role: Role;
};

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Patient)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  getNotifications(@Request() req: { user: User }) {
    return this.notificationService.getPatientNotifications(req.user.id);
  }
}
