import { Router } from 'express';
import * as creatorController from '../controllers/creator.controller';

const router = Router();

// Public routes
router.post('/requests', creatorController.submitCreatorRequest);
router.get('/requests/status/:email', creatorController.getRequestByEmail);

// Admin routes (In a real app, these would have auth middleware)
router.get('/requests', creatorController.getAllCreatorRequests);
router.patch('/requests/:id', creatorController.updateCreatorRequestStatus);

export default router;
