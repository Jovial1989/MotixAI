import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const controller = new AiController();

router.use(authenticate);

router.post('/chat', controller.chat);
router.post('/complete', controller.complete);
router.get('/history', controller.history);

export default router;
