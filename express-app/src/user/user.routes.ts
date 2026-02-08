import { Router } from 'express';
import { protect } from '../Auth/auth.middleware';
import { getMe } from './user.controller';

const router = Router();

router.get('/me', protect, getMe);

export default router;
