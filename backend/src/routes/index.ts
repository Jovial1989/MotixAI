import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import aiRouter from './ai.routes';

export const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/ai', aiRouter);
