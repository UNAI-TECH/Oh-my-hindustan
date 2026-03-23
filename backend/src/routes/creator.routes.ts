import { Router } from 'express';
import * as creatorController from '../controllers/creator.controller';
import { adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/requests', creatorController.submitCreatorRequest);
router.get('/requests/status/:email', creatorController.getRequestByEmail);

// Admin routes
router.get('/requests', adminMiddleware, creatorController.getAllCreatorRequests);
router.patch('/requests/:id', adminMiddleware, creatorController.updateCreatorRequestStatus);

export default router;
