import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patient/entities/patient.entity';
import { Notification } from './notification.entity';
import { NotificationType } from './notification-type.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async createAppointmentNotification(
    patientUserId: number,
    type: NotificationType,
    title: string,
    message: string,
    appointmentId?: number,
  ) {
    const patient = await this.patientRepository.findOne({
      where: { user: { id: patientUserId } },
      relations: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    if (appointmentId) {
      const existingNotification = await this.notificationRepository.findOne({
        where: { appointmentId, type },
      });

      if (existingNotification) {
        return {
          id: existingNotification.id,
          type: existingNotification.type,
          title: existingNotification.title,
          message: existingNotification.message,
          appointmentId: existingNotification.appointmentId,
          createdAt: existingNotification.createdAt,
        };
      }
    }

    const notification = this.notificationRepository.create({
      patient,
      type,
      title,
      message,
      appointmentId: appointmentId ?? null,
    });

    try {
      const savedNotification = await this.notificationRepository.save(notification);
      return {
        id: savedNotification.id,
        type: savedNotification.type,
        title: savedNotification.title,
        message: savedNotification.message,
        appointmentId: savedNotification.appointmentId,
        createdAt: savedNotification.createdAt,
      };
    } catch (error) {
      throw new InternalServerErrorException('Notification creation failed.');
    }
  }

  async getPatientNotifications(patientUserId: number) {
    const patient = await this.patientRepository.findOne({
      where: { user: { id: patientUserId } },
      relations: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    const notifications = await this.notificationRepository.find({
      where: { patient: { id: patient.id } },
      order: { createdAt: 'DESC' },
    });

    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      appointmentId: n.appointmentId,
      createdAt: n.createdAt,
    }));
  }
}
