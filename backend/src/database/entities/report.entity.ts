import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  DISMISSED = 'dismissed',
  ACTIONED = 'actioned',
}

export enum ReportTargetType {
  POST = 'post',
  COMMENT = 'comment',
  USER = 'user',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter!: User;

  @Column({ name: 'reporter_id' })
  reporterId!: string;

  @Column({ name: 'target_id' })
  targetId!: string;

  @Column({ name: 'target_type', type: 'enum', enum: ReportTargetType })
  targetType!: ReportTargetType;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status!: ReportStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
