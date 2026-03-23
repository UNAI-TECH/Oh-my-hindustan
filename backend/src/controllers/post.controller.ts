import { Request, Response } from 'express';
import { prisma } from '../index';
import { PostType } from '@prisma/client';

import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true }
        },
        _count: {
          select: { comments: true, votes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.post.count();

    res.json({
      data: posts.map((p: any) => ({
        ...p,
        vote_count: p._count.votes, // Simple count for now
        comments: p._count.comments
      })),
      total,
      page,
      limit
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPost = async (req: Request, res: Response) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: { id: true, username: true, avatarUrl: true, bio: true }
        },
        _count: {
          select: { comments: true, votes: true }
        }
      }
    });

    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.json({
      ...post,
      vote_count: post._count.votes,
      comments: post._count.comments
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, type, category, thumbnail, subtitle, videoDuration } = req.body;
    const post = await prisma.post.create({
      data: {
        title,
        content,
        type: type as PostType,
        category,
        thumbnail,
        subtitle,
        videoDuration,
        authorId: req.user!.id
      }
    });
    res.status(201).json(post);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
