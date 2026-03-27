import { Router } from 'express';
import { sendCreatorCredentials } from '../controllers/email.controller';

const router = Router();

// A simple middleware to verify the shared admin API secret
const adminApiKeyMiddleware = (req: any, res: any, next: any) => {
  const secret = req.headers['x-admin-api-secret'];
  const expectedSecret = process.env.ADMIN_API_SECRET;

  if (!expectedSecret) {
    console.error('ADMIN_API_SECRET is not configured on the backend.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!secret || secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized via shared secret' });
  }

  next();
};

router.post('/send-credentials', adminApiKeyMiddleware, sendCreatorCredentials);

export default router;
