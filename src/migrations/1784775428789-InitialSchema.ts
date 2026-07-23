import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1784775428789 implements MigrationInterface {
  name = 'InitialSchema1784775428789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Authenticated users (base account)
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "pass" character varying NOT NULL,
        "role" character varying NOT NULL,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // User → Doctor Profile (1:1)
    await queryRunner.query(`
      CREATE TABLE "doctor_profiles" (
        "id" SERIAL NOT NULL,
        "fullName" character varying NOT NULL,
        "specialization" character varying NOT NULL,
        "experience" integer NOT NULL,
        "qualification" character varying NOT NULL,
        "consultationFee" numeric(10,2) NOT NULL,
        "consultationHours" character varying NOT NULL,
        "profileDetails" text,
        "userId" integer,
        CONSTRAINT "UQ_doctor_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_doctor_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_doctor_profiles_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // User → Patient Profile (1:1)
    await queryRunner.query(`
      CREATE TABLE "patient_profiles" (
        "id" SERIAL NOT NULL,
        "fullName" character varying NOT NULL,
        "age" integer NOT NULL,
        "gender" character varying NOT NULL,
        "contactDetails" character varying NOT NULL,
        "basicHealthInformation" text,
        "userId" integer,
        CONSTRAINT "UQ_patient_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_patient_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_patient_profiles_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "patient_profiles"`);
    await queryRunner.query(`DROP TABLE "doctor_profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
