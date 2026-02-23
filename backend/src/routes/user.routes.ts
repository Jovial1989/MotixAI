import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();
const controller = new UserController();

router.use(authenticate);

router.get('/', authorize('admin'), controller.list);
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);
router.delete('/:id', authorize('admin'), controller.remove);

export default router;
