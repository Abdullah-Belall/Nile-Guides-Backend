import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkersEntity } from './worker.entity';
import { LangLevelEnum, StatusEnum } from '../../others/enums';
import { OrdersEntity } from 'src/clients/entities/orders.entity';
import { RatingEntity } from 'src/clients/entities/rate-business.entity';

@Entity('business')
export class BusinessEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ManyToOne(() => WorkersEntity, (worker) => worker.business, {
    onDelete: 'CASCADE',
  })
  worker: WorkersEntity;
  @OneToMany(() => OrdersEntity, (order) => order.business, {
    cascade: true,
  })
  orders: OrdersEntity[];
  @Column()
  title: string;
  @Column()
  description: string;
  @Column()
  language: string;
  @Column({ type: 'enum', enum: LangLevelEnum })
  language_level: LangLevelEnum;
  @Column()
  state: string;
  @Column()
  price: number;
  @Column()
  image: string;
  @OneToMany(() => RatingEntity, (rating) => rating.business)
  ratings: RatingEntity[];
  @Column({ default: '0' })
  rate: string;
  @Column({ default: 0 })
  raters_counter: number;
  @Column({ default: false })
  pause: boolean;
  @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.PENDING })
  admin_accept: StatusEnum;
  @Column({ nullable: true })
  message: string;
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
