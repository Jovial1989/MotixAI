import { Router } from 'express';
import { guidesController } from '../controllers/guides.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

/** POST /guides — create guide (async, returns guide in pending state) */
router.post('/', (req, res, next) => guidesController.create(req, res, next));

/** GET /guides — list authenticated user's guides */
router.get('/', (req, res, next) => guidesController.list(req, res, next));

/** GET /guides/:id — get full guide */
router.get('/:id', (req, res, next) => guidesController.getById(req, res, next));

/** GET /guides/:id/status — poll generation status */
router.get('/:id/status', (req, res, next) => guidesController.getStatus(req, res, next));

export default router;
