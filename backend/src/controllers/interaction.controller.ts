import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const vote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId, type } = req.body; // type: 1 for up, -1 for down, 0 for remove
    const userId = req.user!.id;

    if (type === 0) {
      await prisma.vote.deleteMany({ where: { userId, postId } });
      return res.json({ message: 'Vote removed' });
    }

    const vote = await prisma.vote.upsert({
      where: { userId_postId: { userId, postId } },
      update: { type },
      create: { userId, postId, type }
    });

    res.json(vote);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const comment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId, content } = req.body;
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: req.user!.id
      },
      include: {
        user: { select: { username: true, avatarUrl: true } }
      }
    });
    res.status(201).json(comment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const follow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { followingId } = req.body;
    const followerId = req.user!.id;

    if (followerId === followingId) return res.status(400).json({ message: 'Cannot follow yourself' });

    const follow = await prisma.follow.create({
      data: { followerId, followingId }
    });
    res.json(follow);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const savePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.body;
    const save = await prisma.save.create({
      data: { userId: req.user!.id, postId }
    });
    res.json(save);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
