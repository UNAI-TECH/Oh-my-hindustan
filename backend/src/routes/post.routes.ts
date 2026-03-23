import { Router } from 'express';
import { getPosts, getPost, createPost } from '../controllers/post.controller';
import { authMiddleware, creatorOrAnalystMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', authMiddleware, creatorOrAnalystMiddleware, createPost);

export default router;
