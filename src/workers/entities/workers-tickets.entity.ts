import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusEnum } from '../../others/enums';
import { WorkersEntity } from './worker.entity';

@Entity('workers_tickets')
export class WorkersTicketsEntity {
  @PrimaryGeneratedColumn()
  id: string;
  @ManyToOne(() => WorkersEntity, (worker) => worker.tickets, {
    onDelete: 'CASCADE',
  })
  worker: WorkersEntity;
  @Column()
  subject: string;
  @Column()
  body: string;
  @Column({ default: '' })
  image1: string;
  @Column({ default: '' })
  image2: string;
  @Column({ default: '' })
  image3: string;
  @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.PENDING })
  status: StatusEnum;
  @Column()
  created_at: Date;
  @Column({ nullable: true })
  done_at: Date;
  @BeforeInsert()
  async handle() {
    const now = new Date();
    this.created_at = now;
  }
}
