import { Request, Response, NextFunction } from 'express';
import { guidesService } from '../services/guides.service';

export class GuidesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const guide = await guidesService.create({ userId, ...req.body });
      res.status(202).json({ success: true, data: guide });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const guide = await guidesService.getById(req.params.id, req.user!.id);
      res.json({ success: true, data: guide });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await guidesService.getStatus(req.params.id, req.user!.id);
      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(String(req.query.page ?? '1'), 10);
      const limit = parseInt(String(req.query.limit ?? '20'), 10);
      const result = await guidesService.listByUser(req.user!.id, page, limit);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

export const guidesController = new GuidesController();
