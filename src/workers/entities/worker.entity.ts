import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { GenderEnum, StatesEnum } from '../../others/enums';
import { BusinessEntity } from './business.entity';
import { WorkersTicketsEntity } from './workers-tickets.entity';

@Entity('workers')
export class WorkersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  worker_id: string;
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
  @Column({ default: 'worker' })
  role: string;
  @Column({ select: false })
  password: string;
  @Column({ default: '' })
  forgot_password: string;
  @Column({ nullable: true })
  forgot_password_time: Date;
  @OneToMany(() => WorkersTicketsEntity, (ticket) => ticket.worker, {
    cascade: true,
  })
  tickets: WorkersTicketsEntity[];
  @OneToMany(() => BusinessEntity, (business) => business.worker, {
    cascade: true,
  })
  business: BusinessEntity[];
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
