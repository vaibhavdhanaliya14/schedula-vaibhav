import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('doctor_profiles')
export class DoctorProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column()
  specialization: string;

  @Column()
  experience: number; // in years

  @Column()
  qualification: string;

  @Column('decimal')
  consultationFee: number;

  @Column()
  consultationHours: string;

  @Column('text', { nullable: true })
  profileDetails: string;

  // Link back to the User
  @OneToOne(() => User, (user) => user.doctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}