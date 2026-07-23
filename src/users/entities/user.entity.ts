import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { DoctorProfile } from '../../doctor/entities/doctor.entity';
import { PatientProfile } from '../../patient/entities/patient.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  pass: string;

  @Column()
  role: string; // 'DOCTOR' or 'PATIENT'

  // Establishing the One-to-One relationships (We will create these next!)
  @OneToOne(() => DoctorProfile, (doctorProfile) => doctorProfile.user)
  doctorProfile: DoctorProfile;

  @OneToOne(() => PatientProfile, (patientProfile) => patientProfile.user)
  patientProfile: PatientProfile;
}