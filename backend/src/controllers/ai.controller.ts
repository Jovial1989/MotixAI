import { Request, Response, NextFunction } from 'express';
import { AiService } from '../services/ai.service';

const aiService = new AiService();

export class AiController {
  chat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messages, model } = req.body as { messages: { role: 'user' | 'assistant'; content: string }[]; model?: string };
      const result = await aiService.chat(messages, model);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prompt, model } = req.body as { prompt: string; model?: string };
      const result = await aiService.complete(prompt, model);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
