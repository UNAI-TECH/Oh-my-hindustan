import { Router } from 'express';
import { 
  getOverviewStats, 
  getEconomicDetails, 
  getRecentContributions, 
  createInitiative 
} from '../controllers/admin.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/overview', getOverviewStats);
router.get('/economics', getEconomicDetails);
router.get('/contributions', getRecentContributions);
router.post('/initiatives', createInitiative);

export default router;
