import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClientsEntity } from './client.entity';
import { StatusEnum } from 'src/others/enums';

@Entity('clients_tickets')
export class ClientsTicketsEntity {
  @PrimaryGeneratedColumn()
  id: string;
  @ManyToOne(() => ClientsEntity, (client) => client.tickets, {
    onDelete: 'CASCADE',
  })
  client: ClientsEntity;
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
