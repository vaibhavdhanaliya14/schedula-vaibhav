import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientProfile } from './entities/patient.entity';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(PatientProfile)
    private patientRepository: Repository<PatientProfile>,
  ) {}

  async create(userId: number, createDto: CreatePatientProfileDto) {
    const existingProfile = await this.patientRepository.findOne({ where: { user: { id: userId } } });
    if (existingProfile) {
      throw new ConflictException('Patient profile already exists for this user');
    }

    const profile = this.patientRepository.create({
      ...createDto,
      user: { id: userId },
    });
    return this.patientRepository.save(profile);
  }

  async findOne(userId: number) {
    const profile = await this.patientRepository.findOne({ where: { user: { id: userId } } });
    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }
    return profile;
  }

  async update(userId: number, updateDto: UpdatePatientProfileDto) {
    const profile = await this.findOne(userId);
    Object.assign(profile, updateDto);
    return this.patientRepository.save(profile);
  }
}