import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { Patient } from '../../patient/entities/patient.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { SchedulingType } from '../enums/scheduling-type.enum';
import { DoctorSchedule } from './doctor-schedule.entity';

@Entity('appointments')
@Index(['schedule', 'patient'], { unique: true })
@Index(['schedule', 'tokenNumber'], { unique: true })
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  schedulingType: SchedulingType;

  @Column({ type: 'timestamp' })
  startAt: Date;

  @Column({ type: 'timestamp' })
  endAt: Date;

  @Column({ type: 'int', nullable: true })
  tokenNumber?: number | null;

  @Column({ type: 'varchar', default: AppointmentStatus.Booked })
  status: AppointmentStatus;

  @ManyToOne(() => DoctorSchedule, (schedule) => schedule.appointments, {
    onDelete: 'CASCADE',
  })
  schedule: DoctorSchedule;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  doctor: Doctor;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  patient: Patient;

  @CreateDateColumn()
  createdAt: Date;
}
