import { NissanAdapter } from '../ai/source-adapters/nissan.adapter';
import type { SourcePackage } from '../ai/source-adapters/source-package.types';
import type { GuideQuery, SourceProvider } from './source-provider.interface';

/**
 * NissanSourceProvider
 *
 * Retrieves structured repair data from Nissan service manuals.
 * Data source: NICOclub (https://www.nicoclub.com/nissan-service-manuals)
 *
 * Phase 1: Uses seeded structured data derived from manual sections.
 * Future: Replace with live crawler against NICOclub.
 */
export class NissanSourceProvider implements SourceProvider {
  readonly make = 'Nissan';

  private readonly adapter = new NissanAdapter();

  supports(query: GuideQuery): boolean {
    return (
      this.adapter.supportsModel(query.model)
    );
  }

  async getSourcePackage(query: GuideQuery): Promise<SourcePackage | null> {
    return this.adapter.getPackage(query.model, query.year, query.taskType);
  }
}
