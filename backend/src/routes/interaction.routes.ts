import { Router } from 'express';
import { vote, comment, follow, savePost } from '../controllers/interaction.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/vote', vote);
router.post('/comment', comment);
router.post('/follow', follow);
router.post('/save', savePost);

export default router;
