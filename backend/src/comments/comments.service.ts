import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../database/entities/comment.entity';
import { Post } from '../database/entities/post.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private commentsRepository: Repository<Comment>,
    @InjectRepository(Post) private postsRepository: Repository<Post>,
  ) {}

  async createTopLevel(userId: string, postId: string, body: string) {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const comment = new Comment();
    Object.assign(comment, { authorId: userId, postId, body, depth: 0 });
    const saved = await this.commentsRepository.save(comment);

    // Set ltree path to be the comment's own ID (root level)
    const safePath = saved.id.replace(/-/g, '_');
    saved.path = safePath;
    return this.commentsRepository.save(saved);
  }

  async createReply(userId: string, parentId: string, body: string) {
    const parent = await this.commentsRepository.findOne({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('Parent comment not found');

    const comment = new Comment();
    Object.assign(comment, {
      authorId: userId,
      postId: parent.postId,
      parentId: parent.id,
      body,
      depth: parent.depth + 1,
    });
    const saved = await this.commentsRepository.save(comment);

    // Compute ltree path: parent.path + '.' + child_id
    const safePath = `${parent.path}.${saved.id.replace(/-/g, '_')}`;
    saved.path = safePath;
    return this.commentsRepository.save(saved);
  }

  async getPostComments(postId: string, page: number = 1, limit: number = 50, sort: string = 'best') {
    const query = this.commentsRepository.createQueryBuilder('comment')
      .where('comment.postId = :postId', { postId })
      .leftJoinAndSelect('comment.author', 'author')
      .skip((page - 1) * limit)
      .take(limit);

    if (sort === 'new') query.orderBy('comment.createdAt', 'DESC');
    else if (sort === 'controversial') query.orderBy('comment.voteCount', 'ASC');
    else query.orderBy('comment.voteCount', 'DESC').addOrderBy('comment.createdAt', 'DESC'); // best

    const [comments, total] = await query.getManyAndCount();
    return { data: comments, total, page, limit };
  }

  async update(commentId: string, userId: string, body: string) {
    const comment = await this.commentsRepository.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Not authorized');

    comment.body = body;
    return this.commentsRepository.save(comment);
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.commentsRepository.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Not authorized');

    await this.commentsRepository.delete(commentId);
    return { message: 'Comment deleted' };
  }
}
