import { Router } from 'express';
import { register, login, getMe, updateMe } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe); // Mirroring "users/me" or "auth/me" based on frontend

export default router;
