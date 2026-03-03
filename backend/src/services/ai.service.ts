import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class AiService {
  private client: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new AppError('ANTHROPIC_API_KEY is not configured', 500);
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async chat(messages: Message[], model = DEFAULT_MODEL) {
    const response = await this.client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      messages,
    });

    const content = response.content[0];
    const replyText = content.type === 'text' ? content.text : '';

    return {
      model: response.model,
      role: response.role,
      content: replyText,
      usage: response.usage,
    };
  }

  async complete(prompt: string, model = DEFAULT_MODEL) {
    const response = await this.client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    const completion = content.type === 'text' ? content.text : '';

    return {
      model: response.model,
      prompt,
      completion,
      usage: response.usage,
    };
  }

  async saveSession(userId: string, messages: Message[], reply: string, model = DEFAULT_MODEL) {
    const allMessages = [...messages, { role: 'assistant' as const, content: reply }];
    return prisma.aiSession.create({
      data: { userId, model, messages: allMessages as any },
    });
  }

  async getHistory(userId: string) {
    return prisma.aiSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
