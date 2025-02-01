import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { GenderEnum, AdminsEnum, StatesEnum } from '../../others/enums';

@Entity('admins')
export class AdminsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  admin_id: string;
  @Column()
  first_name: string;
  @Column()
  last_name: string;
  @Column({ unique: true })
  email: string;
  @Column()
  age: number;
  @Column({ nullable: true })
  avatar: string;
  @Column({ type: 'enum', enum: GenderEnum })
  gender: GenderEnum;
  @Column({ type: 'enum', enum: StatesEnum })
  state: StatesEnum;
  @Column({ type: 'enum', enum: AdminsEnum, default: AdminsEnum.ADMIN })
  role: AdminsEnum;
  @Column({ select: false })
  password: string;
  @Column({ default: '' })
  forgot_password: string;
  @Column({ nullable: true })
  forgot_password_time: Date;
  @Column({ nullable: true })
  last_login: Date;
  @Column({ default: 0 })
  failed_login_attempts: number;
  @Column({ nullable: true })
  account_locked_until: Date;
  @Column({ default: false })
  is_banded: boolean;
  @Column({ nullable: true })
  band_reason: string;
  @Column({ nullable: true })
  band_by: string;
  @Column()
  created_at: Date;
  @Column()
  updated_at: Date;
  @BeforeInsert()
  async handle() {
    this.updated_at = new Date();
  }
  @BeforeUpdate()
  handleUpdate() {
    this.updated_at = new Date();
  }
}
