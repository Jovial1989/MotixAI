import { Router } from 'express';
import { vehiclesController } from '../controllers/vehicles.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

/** GET /vehicles/search?q= */
router.get('/search', (req, res, next) => vehiclesController.search(req, res, next));

/** GET /vehicles/decode/:vin */
router.get('/decode/:vin', (req, res, next) => vehiclesController.decodeVin(req, res, next));

export default router;
