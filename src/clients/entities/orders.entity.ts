import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClientsEntity } from './client.entity';
import { StatusEnum } from 'src/others/enums';
import { BusinessEntity } from 'src/workers/entities/business.entity';

@Entity('orders')
export class OrdersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(() => ClientsEntity, (client) => client.orders, {
    onDelete: 'CASCADE',
  })
  client: ClientsEntity;
  @ManyToOne(() => BusinessEntity, (business) => business.orders)
  business: BusinessEntity;
  @Column()
  from: string;
  @Column()
  to: string;
  @Column()
  day: string;
  @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.PENDING })
  worker_accept: StatusEnum;
  @Column({ default: false })
  client_cancel: boolean;
  @Column({ default: 0 })
  client_paid: number;
  @Column({ default: 0 })
  company_paid: number;
  @Column()
  created_at: Date;
  @Column()
  updated_at: Date;
  @BeforeInsert()
  handle() {
    const now = new Date();
    this.created_at = now;
    this.updated_at = now;
  }
  @BeforeUpdate()
  handleUpdate() {
    this.updated_at = new Date();
  }
}
