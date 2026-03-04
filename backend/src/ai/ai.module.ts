import { Module } from '@nestjs/common';
import { GeminiProvider } from './gemini.provider';
import { GeminiImageProvider } from './gemini-image.provider';

@Module({
  providers: [GeminiProvider, GeminiImageProvider],
  exports: [GeminiProvider, GeminiImageProvider],
})
export class AiModule {}
