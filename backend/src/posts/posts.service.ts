import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post as PostEntity } from '../database/entities/post.entity';
import { SavedPost } from '../database/entities/saved-post.entity';
import { Community } from '../database/entities/community.entity';
import { CommunityMember } from '../database/entities/community-member.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private postsRepository: Repository<PostEntity>,
    @InjectRepository(SavedPost)
    private savedPostsRepository: Repository<SavedPost>,
    @InjectRepository(Community)
    private communitiesRepository: Repository<Community>,
  ) {}

  async create(userId: string, data: any) {
    const community = await this.communitiesRepository.findOne({ where: { id: data.communityId } });
    if (!community) throw new NotFoundException('Community not found');

    const postData = { ...data, authorId: userId };
    const post = new PostEntity();
    Object.assign(post, postData);
    return this.postsRepository.save(post);
  }

  async findOne(id: string) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author', 'community'],
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(id: string, userId: string, updateData: any) {
    const post = await this.findOne(id);
    if (post.authorId !== userId) throw new ForbiddenException('Not authorized');
    
    await this.postsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async delete(id: string, userId: string) {
    const post = await this.findOne(id);
    if (post.authorId !== userId) throw new ForbiddenException('Not authorized');
    
    await this.postsRepository.delete(id);
    return { message: 'Post deleted successfully' };
  }

  async getHomeFeed(userId: string | null, page: number = 1, limit: number = 20) {
    const query = this.postsRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .orderBy('post.hotScore', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (userId) {
      // Filter by joined communities. If no joined communities, fallback to all.
      const joinedIdsRes = await this.postsRepository.query(
        `SELECT community_id FROM community_members WHERE user_id = $1`,
        [userId]
      );
      const joinedIds = joinedIdsRes.map((r: any) => r.community_id);
      if (joinedIds.length > 0) {
        query.andWhere('post.communityId IN (:...joinedIds)', { joinedIds });
      }
    }

    const [posts, total] = await query.getManyAndCount();
    return { data: posts, total, page, limit };
  }

  async getCommunityFeed(slug: string, page: number = 1, limit: number = 20, sort: string = 'hot') {
    const community = await this.communitiesRepository.findOne({ where: { slug } });
    if (!community) throw new NotFoundException('Community not found');

    const query = this.postsRepository.createQueryBuilder('post')
      .where('post.communityId = :communityId', { communityId: community.id })
      .leftJoinAndSelect('post.author', 'author')
      .skip((page - 1) * limit)
      .take(limit);

    if (sort === 'new') query.orderBy('post.createdAt', 'DESC');
    else if (sort === 'top') query.orderBy('post.voteCount', 'DESC');
    else query.orderBy('post.hotScore', 'DESC').addOrderBy('post.createdAt', 'DESC');

    const [posts, total] = await query.getManyAndCount();
    return { data: posts, total, page, limit };
  }

  async savePost(userId: string, postId: string) {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.savedPostsRepository.findOne({ where: { userId, postId } });
    if (existing) return { message: 'Already saved' };

    const saved = new SavedPost();
    Object.assign(saved, { userId, postId });
    await this.savedPostsRepository.save(saved);
    return { message: 'Saved successfully' };
  }

  async unsavePost(userId: string, postId: string) {
    await this.savedPostsRepository.delete({ userId, postId });
    return { message: 'Unsaved successfully' };
  }

  async getSavedPosts(userId: string, page: number = 1, limit: number = 20) {
    const [saved, total] = await this.savedPostsRepository.findAndCount({
      where: { userId },
      relations: ['post', 'post.author', 'post.community'],
      order: { savedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: saved.map(s => s.post), total, page, limit };
  }
}

