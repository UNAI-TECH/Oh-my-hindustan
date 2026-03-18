import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Community } from './community.entity';

export enum PostType {
  TEXT = 'text',
  LINK = 'link',
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  body!: string;

  @Column({ type: 'enum', enum: PostType, default: PostType.TEXT })
  type!: PostType;

  @Column({ name: 'media_url', nullable: true })
  mediaUrl!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column({ name: 'author_id' })
  authorId!: string;

  @ManyToOne(() => Community)
  @JoinColumn({ name: 'community_id' })
  community!: Community;

  @Column({ name: 'community_id' })
  communityId!: string;

  @Column({ name: 'vote_count', default: 0 })
  voteCount!: number;

  @Column({ name: 'hot_score', type: 'float', default: 0 })
  hotScore!: number;

  @Column({ nullable: true })
  lang!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
