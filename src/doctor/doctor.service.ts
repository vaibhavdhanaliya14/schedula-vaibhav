import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

const UPDATABLE_DOCTOR_FIELDS = [
  'fullName',
  'specialization',
  'experience',
  'qualification',
  'consultationFee',
  'availability',
  'profileDetails',
] as const;

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async create(userId: number, createDoctorDto: CreateDoctorProfileDto) {
    const existingProfile = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
    });
    if (existingProfile) {
      throw new ConflictException(
        'Doctor profile already exists for this user.',
      );
    }

    try {
      const profile = this.doctorRepository.create({
        ...createDoctorDto,
        user: { id: userId },
      });
      return await this.doctorRepository.save(profile);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'Doctor profile already exists for this user.',
        );
      }
      throw error;
    }
  }

  async findOne(userId: number) {
    const profile = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found.');
    }
    return profile;
  }

  async update(userId: number, updateDoctorDto: UpdateDoctorProfileDto) {
    const hasUpdatableField = UPDATABLE_DOCTOR_FIELDS.some(
      (field) => updateDoctorDto[field] !== undefined,
    );
    if (!hasUpdatableField) {
      throw new BadRequestException(
        'At least one profile field is required to update. Restricted fields (id, userId) cannot be updated.',
      );
    }

    const profile = await this.findOne(userId);

    for (const field of UPDATABLE_DOCTOR_FIELDS) {
      if (updateDoctorDto[field] !== undefined) {
        profile[field] = updateDoctorDto[field] as never;
      }
    }

    return this.doctorRepository.save(profile);
  }
}
