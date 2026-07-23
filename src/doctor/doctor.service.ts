import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorProfile } from './entities/doctor.entity';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(DoctorProfile)
    private doctorRepository: Repository<DoctorProfile>,
  ) {}

  async create(userId: number, createDto: CreateDoctorProfileDto) {
    // Edge Case: Prevent duplicate profile creation
    const existingProfile = await this.doctorRepository.findOne({ where: { user: { id: userId } } });
    if (existingProfile) {
      throw new ConflictException('Doctor profile already exists for this user');
    }

    const profile = this.doctorRepository.create({
      ...createDto,
      user: { id: userId }, // Link to the authenticated user
    });
    return this.doctorRepository.save(profile);
  }

  async findOne(userId: number) {
    const profile = await this.doctorRepository.findOne({ where: { user: { id: userId } } });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    return profile;
  }

  async update(userId: number, updateDto: UpdateDoctorProfileDto) {
    const profile = await this.findOne(userId); // Reuses the not found logic
    Object.assign(profile, updateDto);
    return this.doctorRepository.save(profile);
  }
}