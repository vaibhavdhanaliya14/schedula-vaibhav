import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdvancedScheduling1784800000000 implements MigrationInterface {
  name = 'AdvancedScheduling1784800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "doctor_schedules" (
        "id" SERIAL NOT NULL,
        "schedulingType" character varying NOT NULL,
        "startAt" TIMESTAMP NOT NULL,
        "endAt" TIMESTAMP NOT NULL,
        "slotDurationMinutes" integer,
        "bufferTimeMinutes" integer NOT NULL DEFAULT 0,
        "maxPatients" integer,
        "doctorId" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doctor_schedules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_doctor_schedules_doctor"
          FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" SERIAL NOT NULL,
        "schedulingType" character varying NOT NULL,
        "startAt" TIMESTAMP NOT NULL,
        "endAt" TIMESTAMP NOT NULL,
        "tokenNumber" integer,
        "status" character varying NOT NULL DEFAULT 'BOOKED',
        "scheduleId" integer,
        "doctorId" integer,
        "patientId" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_appointments_schedule_patient" UNIQUE ("scheduleId", "patientId"),
        CONSTRAINT "UQ_appointments_schedule_token" UNIQUE ("scheduleId", "tokenNumber"),
        CONSTRAINT "FK_appointments_schedule"
          FOREIGN KEY ("scheduleId") REFERENCES "doctor_schedules"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_appointments_doctor"
          FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_appointments_patient"
          FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_appointments_stream_schedule_start"
      ON "appointments" ("scheduleId", "startAt")
      WHERE "schedulingType" = 'STREAM'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_appointments_stream_schedule_start"`,
    );
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP TABLE "doctor_schedules"`);
  }
}
