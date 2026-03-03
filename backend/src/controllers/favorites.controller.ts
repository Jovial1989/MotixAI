import { Request, Response, NextFunction } from 'express';
import { favoritesService } from '../services/favorites.service';

export class FavoritesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await favoritesService.list(req.user!.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async add(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await favoritesService.add(req.user!.id, req.body.guideId);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await favoritesService.remove(req.user!.id, req.params.guideId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const favoritesController = new FavoritesController();
