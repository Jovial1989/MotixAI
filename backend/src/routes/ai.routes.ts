import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { chatSchema, completeSchema } from '../validators/ai.validator';

const router = Router();
const controller = new AiController();

router.use(authenticate);

router.post('/chat', validate(chatSchema), controller.chat);
router.post('/complete', validate(completeSchema), controller.complete);

export default router;
