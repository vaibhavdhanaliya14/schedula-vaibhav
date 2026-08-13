import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

const UPDATABLE_PATIENT_FIELDS = [
  'fullName',
  'age',
  'gender',
  'contactDetails',
  'basicHealthInformation',
] as const;

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(userId: number, createPatientDto: CreatePatientProfileDto) {
    const existingProfile = await this.patientRepository.findOne({
      where: { user: { id: userId } },
    });
    if (existingProfile) {
      throw new ConflictException(
        'Patient profile already exists for this user.',
      );
    }

    try {
      const profile = this.patientRepository.create({
        ...createPatientDto,
        user: { id: userId },
      });
      return await this.patientRepository.save(profile);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'Patient profile already exists for this user.',
        );
      }
      throw error;
    }
  }

  async findOne(userId: number) {
    const profile = await this.patientRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) {
      throw new NotFoundException('Patient profile not found.');
    }
    return profile;
  }

  async update(userId: number, updatePatientDto: UpdatePatientProfileDto) {
    const hasUpdatableField = UPDATABLE_PATIENT_FIELDS.some(
      (field) => updatePatientDto[field] !== undefined,
    );
    if (!hasUpdatableField) {
      throw new BadRequestException(
        'At least one profile field is required to update. Restricted fields (id, userId) cannot be updated.',
      );
    }

    const profile = await this.findOne(userId);

    for (const field of UPDATABLE_PATIENT_FIELDS) {
      if (updatePatientDto[field] !== undefined) {
        profile[field] = updatePatientDto[field] as never;
      }
    }

    return this.patientRepository.save(profile);
  }
}
