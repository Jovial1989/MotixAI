import type { SourcePackage, TaskType } from '../ai/source-adapters/source-package.types';

export interface GuideQuery {
  make: string;
  model: string;
  year: number;
  component: string;
  taskType: TaskType;
}

/**
 * A SourceProvider retrieves structured repair data for a specific vehicle make
 * from an authoritative source (e.g. NICOclub service manuals, ToyoDIY).
 *
 * The provider abstraction decouples the guide-generation service from specific
 * data sources, making it easy to swap seeded data for live crawlers later.
 */
export interface SourceProvider {
  /** Vehicle make this provider covers (case-insensitive). */
  readonly make: string;

  /** Returns true if this provider has data for the given query. */
  supports(query: GuideQuery): boolean;

  /**
   * Retrieves a SourcePackage for the query.
   * Returns null if no data is available for this specific procedure.
   */
  getSourcePackage(query: GuideQuery): Promise<SourcePackage | null>;
}
