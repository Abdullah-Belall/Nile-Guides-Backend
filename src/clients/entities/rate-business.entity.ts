import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
  BeforeInsert,
} from 'typeorm';
import { ClientsEntity } from './client.entity';
import { BusinessEntity } from 'src/workers/entities/business.entity';

@Entity('ratings')
@Unique(['client', 'business'])
export class RatingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;
  @ManyToOne(() => ClientsEntity, (client) => client.ratings, {
    onDelete: 'CASCADE',
  })
  client: ClientsEntity;
  @ManyToOne(() => BusinessEntity, (business) => business.ratings, {
    onDelete: 'CASCADE',
  })
  business: BusinessEntity;
  @Column({ type: 'int', nullable: false })
  rating: number;
  @Column()
  created_at: Date;
  @BeforeInsert()
  handle() {
    this.created_at = new Date();
  }
}
