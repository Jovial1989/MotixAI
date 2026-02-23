import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();

export class UserController {
  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.findAll();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.findById(req.params.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.update(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.remove(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
