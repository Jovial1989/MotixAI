import { Request, Response, NextFunction } from 'express';
import { vehiclesService } from '../services/vehicles.service';

export class VehiclesController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = String(req.query.q ?? '');
      if (!q) return res.json({ success: true, data: [] });
      const results = await vehiclesService.search(q);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  }

  async decodeVin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await vehiclesService.decodeVin(req.params.vin);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const vehiclesController = new VehiclesController();
