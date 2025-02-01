import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { GenderEnum } from '../../others/enums';

@Entity('not_verfied_users')
export class NotVerfiedUsersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
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
  @Column({ select: false })
  password: string;
  @Column()
  verification_code: string;
  @Column()
  created_at: Date;
}
