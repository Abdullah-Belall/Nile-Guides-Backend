import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity('users_role')
export class UsersRoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  user_id: string;
  @Column({ unique: true })
  email: string;
  @Column({ default: 'client' })
  role: string;
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
