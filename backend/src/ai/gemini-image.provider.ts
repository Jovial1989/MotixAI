// TODO: Replace GeminiImageProvider with pluggable provider if needed.
import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIImageProvider } from './ai-provider.interface';

@Injectable()
export class GeminiImageProvider implements AIImageProvider {
  private readonly logger = new Logger(GeminiImageProvider.name);
  private readonly client: GoogleGenerativeAI | null;
  private readonly enabled: boolean;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    this.enabled = process.env.ENABLE_STEP_IMAGES !== 'false';
    this.client = key && key !== 'replace-with-real-key' ? new GoogleGenerativeAI(key) : null;
    if (!this.client) {
      this.logger.warn('GEMINI_API_KEY not set — step images will use placeholders');
    }
  }

  async generateImage(prompt: string): Promise<{ imageUrl: string }> {
    if (!this.enabled || !this.client) {
      return this.placeholder(prompt);
    }

    try {
      return await this.tryGenerate(prompt);
    } catch (err) {
      this.logger.warn(`Image generation attempt 1 failed: ${err instanceof Error ? err.message : err}`);
      await new Promise((r) => setTimeout(r, 2000));
      try {
        return await this.tryGenerate(prompt);
      } catch (retryErr) {
        this.logger.error(`Image generation failed after retry: ${retryErr instanceof Error ? retryErr.message : retryErr}`);
        throw retryErr;
      }
    }
  }

  private async tryGenerate(prompt: string): Promise<{ imageUrl: string }> {
    const model = this.client!.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
    });

    const result = await (model.generateContent as Function)({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    const candidates: unknown[] = (result.response.candidates as unknown[]) ?? [];
    for (const candidate of candidates) {
      const parts: unknown[] = (candidate as { content?: { parts?: unknown[] } }).content?.parts ?? [];
      for (const part of parts) {
        const p = part as { inlineData?: { data?: string; mimeType?: string } };
        if (p.inlineData?.data) {
          const mime = p.inlineData.mimeType ?? 'image/png';
          return { imageUrl: `data:${mime};base64,${p.inlineData.data}` };
        }
      }
    }

    throw new Error('No image data returned from Gemini');
  }

  private placeholder(prompt: string): { imageUrl: string } {
    const label = encodeURIComponent(prompt.slice(0, 50));
    return { imageUrl: `https://placehold.co/1200x800/f1f5f9/94a3b8?text=${label}` };
  }
}
