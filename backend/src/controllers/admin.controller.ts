import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getOverviewStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeAnalysts = await prisma.user.count({ where: { role: 'ANALYST' } });
    
    // Calculate daily posts (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyPosts = await prisma.post.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // Fetch last 5 posts for recent activity
    const recentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        title: true,
        author: {
          select: {
            username: true
          }
        },
        createdAt: true,
        type: true
      }
    });

    res.json({
      stats: {
        totalUsers: totalUsers.toLocaleString(),
        dailyPosts: dailyPosts.toLocaleString(),
        engagementRate: "68.4%", // Dummy for now
        activeAnalysts: activeAnalysts.toString()
      },
      recentActivity: recentPosts.map(post => ({
        title: post.title,
        author: post.author.username,
        date: post.createdAt,
        status: 'Approved' // Simplified for UI matching
      }))
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEconomicDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      totalFund: "₹12.8Cr",
      distribution: [
        { label: "Premium Membership", value: "₹5.77Cr", color: "#E53935" },
        { label: "Corporate Support", value: "₹3.85Cr", color: "#E2E8F0" },
        { label: "Analyst Grants", value: "₹3.21Cr", color: "#475569" }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecentContributions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Mocking based on AdminOverviewScreen.tsx UI
    res.json([
      { user: "amit_s", amount: "₹499", status: "Verified", statusBg: "#DCFCE7", statusColor: "#16A34A" },
      { user: "raj_bjp", amount: "₹1,200", status: "Review", statusBg: "#FEF3C7", statusColor: "#D97706" },
      { user: "priya_m", amount: "₹150", status: "Verified", statusBg: "#DCFCE7", statusColor: "#16A34A" }
    ]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createInitiative = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, allocation } = req.body;
    // Logically would create a "CommunityInitiative" record
    res.status(201).json({ 
      message: 'Initiative created successfully',
      initiative: { name, allocation, status: 'Launched' }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
