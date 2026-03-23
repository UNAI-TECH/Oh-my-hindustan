import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getOverviewStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // In a real app, these would be dynamic counts/aggregates
    const verifiedCitizens = await prisma.user.count({ where: { role: 'CITIZEN' } });
    const activeDebates = await prisma.post.count({ where: { type: 'DEBATE' } });
    
    // Mocking some financial data since we don't have a Transactions table yet
    res.json({
      verifiedCitizens: (125432 + verifiedCitizens).toLocaleString(),
      activeDebates: (12240 + activeDebates).toLocaleString(),
      platformFund: "₹4.52Cr",
      factCheckQueue: "12 New",
      verifiedChange: "+12.5%",
      debatesChange: "+5.2%",
      fundChange: "+18.1%"
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
