import { prisma } from '../config/database';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AiService {
  async chat(messages: Message[], model = 'claude-sonnet-4-6') {
    // TODO: Integrate Anthropic SDK
    // import Anthropic from '@anthropic-ai/sdk';
    // const client = new Anthropic();
    // const response = await client.messages.create({ model, max_tokens: 1024, messages });
    return {
      model,
      messages,
      response: 'AI integration placeholder – wire up Anthropic SDK here.',
    };
  }

  async complete(prompt: string, model = 'claude-sonnet-4-6') {
    return {
      model,
      prompt,
      completion: 'Completion placeholder – wire up Anthropic SDK here.',
    };
  }

  async getHistory(userId: string) {
    return prisma.aiSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
