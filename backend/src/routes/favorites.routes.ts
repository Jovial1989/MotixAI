import { Router } from 'express';
import { favoritesController } from '../controllers/favorites.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

/** GET /favorites */
router.get('/', (req, res, next) => favoritesController.list(req, res, next));

/** POST /favorites — body: { guideId } */
router.post('/', (req, res, next) => favoritesController.add(req, res, next));

/** DELETE /favorites/:guideId */
router.delete('/:guideId', (req, res, next) => favoritesController.remove(req, res, next));

export default router;
