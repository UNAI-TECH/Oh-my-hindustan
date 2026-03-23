import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const submitCreatorRequest = async (req: Request, res: Response) => {
  try {
    const { name, email, bio, portfolioUrl } = req.body;

    if (!name || !email || !bio) {
      return res.status(400).json({ error: 'Name, email, and bio are required' });
    }

    const existingRequest = await prisma.creatorRequest.findUnique({
      where: { email }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'A request with this email already exists' });
    }

    const request = await prisma.creatorRequest.create({
      data: {
        name,
        email,
        bio,
        portfolioUrl,
        status: 'PENDING'
      }
    });

    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit request', message: error.message });
  }
};

export const getAllCreatorRequests = async (req: Request, res: Response) => {
  try {
    const requests = await prisma.creatorRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch requests', message: error.message });
  }
};

export const updateCreatorRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminMessage } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await prisma.creatorRequest.update({
      where: { id },
      data: { status, adminMessage }
    });

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update request', message: error.message });
  }
};

export const getRequestByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const request = await prisma.creatorRequest.findUnique({
      where: { email }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch request', message: error.message });
  }
};
