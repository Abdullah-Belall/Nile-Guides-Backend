import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { GenderEnum } from '../../others/enums';
import { OrdersEntity } from './orders.entity';
import { ClientsTicketsEntity } from './client-tickets.entity';
import { RatingEntity } from './rate-business.entity';

@Entity('clients')
export class ClientsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  client_id: string;
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
  @Column({ default: 'client' })
  role: string;
  @OneToMany(() => RatingEntity, (rating) => rating.client, {
    cascade: true,
  })
  ratings: RatingEntity[];
  @Column({ select: false })
  password: string;
  @Column({ default: '' })
  forgot_password: string;
  @Column({ nullable: true })
  forgot_password_time: Date;
  @OneToMany(() => OrdersEntity, (oreder) => oreder.client, {
    onDelete: 'CASCADE',
  })
  orders: OrdersEntity[];
  @OneToMany(() => ClientsTicketsEntity, (ticket) => ticket.client)
  tickets: ClientsTicketsEntity[];
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
    const now = new Date();
    this.created_at = now;
    this.updated_at = now;
  }
  @BeforeUpdate()
  handleUpdate() {
    this.updated_at = new Date();
  }
}
