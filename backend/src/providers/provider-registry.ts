import { NissanSourceProvider } from './nissan-provider';
import { ToyotaSourceProvider } from './toyota-provider';
import type { GuideQuery, SourceProvider } from './source-provider.interface';
import type { SourcePackage } from '../ai/source-adapters/source-package.types';

/**
 * ProviderRegistry
 *
 * Central registry for all SourceProviders.
 * Routes a GuideQuery to the correct provider by vehicle make.
 *
 * Registered providers (Phase 1 — seeded data):
 *   - NissanSourceProvider  → NICOclub service manuals
 *   - ToyotaSourceProvider  → ToyoDIY component references
 */
export class ProviderRegistry {
  private readonly providers: SourceProvider[] = [
    new NissanSourceProvider(),
    new ToyotaSourceProvider(),
  ];

  getProvider(make: string): SourceProvider | null {
    const norm = make.trim().toLowerCase();
    return this.providers.find((p) => p.make.toLowerCase() === norm) ?? null;
  }

  async getSourcePackage(query: GuideQuery): Promise<SourcePackage | null> {
    const provider = this.getProvider(query.make);
    if (!provider) return null;
    return provider.getSourcePackage(query);
  }

  listSupportedMakes(): string[] {
    return this.providers.map((p) => p.make);
  }

  isMakeSupported(make: string): boolean {
    return this.getProvider(make) !== null;
  }

  supportsQuery(query: GuideQuery): boolean {
    const provider = this.getProvider(query.make);
    return provider ? provider.supports(query) : false;
  }
}
