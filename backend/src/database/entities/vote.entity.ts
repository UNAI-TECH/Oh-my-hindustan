import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

export enum TargetType {
  POST = 'post',
  COMMENT = 'comment',
}

@Entity('votes')
@Unique(['userId', 'targetId', 'targetType'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'target_id' })
  targetId!: string;

  @Column({ name: 'target_type', type: 'enum', enum: TargetType })
  targetType!: TargetType;

  @Column({ type: 'smallint' })
  value!: number; // 1 or -1

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
