import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import aiRouter from './ai.routes';
import guidesRouter from './guides.routes';
import vehiclesRouter from './vehicles.routes';
import favoritesRouter from './favorites.routes';

export const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/ai', aiRouter);
router.use('/guides', guidesRouter);
router.use('/vehicles', vehiclesRouter);
router.use('/favorites', favoritesRouter);
