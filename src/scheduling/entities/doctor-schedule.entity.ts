import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { SchedulingType } from '../enums/scheduling-type.enum';
import { Appointment } from './appointment.entity';

@Entity('doctor_schedules')
export class DoctorSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  schedulingType: SchedulingType;

  @Column({ type: 'timestamp' })
  startAt: Date;

  @Column({ type: 'timestamp' })
  endAt: Date;

  @Column({ type: 'int', nullable: true })
  slotDurationMinutes?: number | null;

  @Column({ type: 'int', default: 0 })
  bufferTimeMinutes: number;

  @Column({ type: 'int', nullable: true })
  maxPatients?: number | null;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  doctor: Doctor;

  @OneToMany(() => Appointment, (appointment) => appointment.schedule)
  appointments: Appointment[];

  @CreateDateColumn()
  createdAt: Date;
}
