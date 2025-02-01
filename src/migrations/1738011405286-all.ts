import { MigrationInterface, QueryRunner } from "typeorm";

export class All1738011405286 implements MigrationInterface {
    name = 'All1738011405286'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users_role" ADD "is_banded" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users_role" ADD "band_reason" character varying`);
        await queryRunner.query(`ALTER TABLE "users_role" ADD "band_by" character varying`);
        await queryRunner.query(`ALTER TABLE "workers" ADD "is_banded" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "workers" ADD "band_reason" character varying`);
        await queryRunner.query(`ALTER TABLE "workers" ADD "band_by" character varying`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "is_banded" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "band_reason" character varying`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "band_by" character varying`);
        await queryRunner.query(`ALTER TABLE "admins" ADD "is_banded" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "admins" ADD "band_reason" character varying`);
        await queryRunner.query(`ALTER TABLE "admins" ADD "band_by" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN "band_by"`);
        await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN "band_reason"`);
        await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN "is_banded"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "band_by"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "band_reason"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "is_banded"`);
        await queryRunner.query(`ALTER TABLE "workers" DROP COLUMN "band_by"`);
        await queryRunner.query(`ALTER TABLE "workers" DROP COLUMN "band_reason"`);
        await queryRunner.query(`ALTER TABLE "workers" DROP COLUMN "is_banded"`);
        await queryRunner.query(`ALTER TABLE "users_role" DROP COLUMN "band_by"`);
        await queryRunner.query(`ALTER TABLE "users_role" DROP COLUMN "band_reason"`);
        await queryRunner.query(`ALTER TABLE "users_role" DROP COLUMN "is_banded"`);
    }

}
