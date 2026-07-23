import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('doctor_profiles')
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column()
  specialization: string;

  @Column('int')
  experience: number;

  @Column()
  qualification: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  consultationFee: number;

  @Column({ name: 'consultationHours' })
  availability: string;

  @Column({ type: 'text', nullable: true })
  profileDetails?: string;

  @OneToOne(() => User, (user) => user.doctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
