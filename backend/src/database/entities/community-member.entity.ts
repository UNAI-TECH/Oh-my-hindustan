import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Community } from './community.entity';

export enum CommunityRole {
  MEMBER = 'member',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

@Entity('community_members')
export class CommunityMember {
  @PrimaryColumn({ name: 'user_id' })
  userId!: string;

  @PrimaryColumn({ name: 'community_id' })
  communityId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Community)
  @JoinColumn({ name: 'community_id' })
  community!: Community;

  @Column({ type: 'enum', enum: CommunityRole, default: CommunityRole.MEMBER })
  role!: CommunityRole;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;
}
