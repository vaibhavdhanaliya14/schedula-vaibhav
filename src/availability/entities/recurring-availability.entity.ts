import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { DayOfWeek } from '../dto/day-of-week.enum';

@Entity('recurring_availabilities')
export class RecurringAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 9 })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.recurringAvailabilities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;
}
