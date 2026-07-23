import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { Patient } from '../../patient/entities/patient.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  pass: string;

  @Column()
  role: string;

  @OneToOne(() => Doctor, (doctor) => doctor.user)
  doctorProfile: Doctor;

  @OneToOne(() => Patient, (patient) => patient.user)
  patientProfile: Patient;
}