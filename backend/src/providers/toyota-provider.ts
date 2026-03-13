import { ToyotaAdapter } from '../ai/source-adapters/toyota.adapter';
import type { SourcePackage } from '../ai/source-adapters/source-package.types';
import type { GuideQuery, SourceProvider } from './source-provider.interface';

/**
 * ToyotaSourceProvider
 *
 * Retrieves structured repair data from Toyota component references.
 * Data source: ToyoDIY (https://www.toyodiy.com/)
 *
 * Phase 1: Uses seeded structured data derived from component reference pages.
 * Future: Replace with live crawler against ToyoDIY.
 */
export class ToyotaSourceProvider implements SourceProvider {
  readonly make = 'Toyota';

  private readonly adapter = new ToyotaAdapter();

  supports(query: GuideQuery): boolean {
    return this.adapter.supportsModel(query.model);
  }

  async getSourcePackage(query: GuideQuery): Promise<SourcePackage | null> {
    return this.adapter.getPackage(query.model, query.year, query.taskType);
  }
}
