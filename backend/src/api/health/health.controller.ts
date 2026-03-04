import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GeminiProvider } from 'src/ai/gemini.provider';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly gemini: GeminiProvider) {}

  @Get()
  async check() {
    const apiKeySet =
      !!process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'replace-with-real-key';

    const geminiConnected = apiKeySet ? await this.gemini.isConnected() : false;

    return {
      status: 'ok',
      gemini: {
        apiKeySet,
        connected: geminiConnected,
        mode: apiKeySet ? (geminiConnected ? 'live' : 'key-set-but-unreachable') : 'mock',
      },
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        note: 'Image generation queued when Redis is available',
      },
    };
  }
}
