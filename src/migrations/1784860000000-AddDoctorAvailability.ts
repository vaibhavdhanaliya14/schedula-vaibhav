import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDoctorAvailability1784860000000 implements MigrationInterface {
  name = 'AddDoctorAvailability1784860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "recurring_availabilities" (
        "id" SERIAL NOT NULL,
        "dayOfWeek" character varying(9) NOT NULL,
        "startTime" time NOT NULL,
        "endTime" time NOT NULL,
        "doctorId" integer NOT NULL,
        CONSTRAINT "CHK_recurring_availabilities_dayOfWeek"
          CHECK ("dayOfWeek" IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
        CONSTRAINT "CHK_recurring_availabilities_time_range"
          CHECK ("startTime" < "endTime"),
        CONSTRAINT "UQ_recurring_availabilities_slot"
          UNIQUE ("doctorId", "dayOfWeek", "startTime", "endTime"),
        CONSTRAINT "PK_recurring_availabilities" PRIMARY KEY ("id"),
        CONSTRAINT "FK_recurring_availabilities_doctor"
          FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recurring_availabilities_doctor_day"
      ON "recurring_availabilities" ("doctorId", "dayOfWeek")
    `);

    await queryRunner.query(`
      CREATE TABLE "custom_availabilities" (
        "id" SERIAL NOT NULL,
        "date" date NOT NULL,
        "startTime" time NOT NULL,
        "endTime" time NOT NULL,
        "doctorId" integer NOT NULL,
        CONSTRAINT "CHK_custom_availabilities_time_range"
          CHECK ("startTime" < "endTime"),
        CONSTRAINT "UQ_custom_availabilities_slot"
          UNIQUE ("doctorId", "date", "startTime", "endTime"),
        CONSTRAINT "PK_custom_availabilities" PRIMARY KEY ("id"),
        CONSTRAINT "FK_custom_availabilities_doctor"
          FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_custom_availabilities_doctor_date"
      ON "custom_availabilities" ("doctorId", "date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_custom_availabilities_doctor_date"`,
    );
    await queryRunner.query(`DROP TABLE "custom_availabilities"`);
    await queryRunner.query(
      `DROP INDEX "IDX_recurring_availabilities_doctor_day"`,
    );
    await queryRunner.query(`DROP TABLE "recurring_availabilities"`);
  }
}
