import { getNissanPackage } from "./nissan.ts";
import { getToyotaPackage } from "./toyota.ts";
import type { SourcePackage, TaskType } from "./types.ts";

/**
 * Look up a source package for a given make/model/year/taskType.
 * Routes strictly by make — never cross-pollinate adapters across makes.
 * Returns null if no seeded source data exists for this combination.
 */
export function getSourcePackage(
  make: string,
  model: string,
  year: number,
  taskType: TaskType,
): SourcePackage | null {
  const makeLower = make.toLowerCase().trim();

  // Strict make-based routing: only Nissan make uses the Nissan adapter,
  // only Toyota make uses the Toyota adapter. No model-name cross-matching.
  if (makeLower === "nissan") {
    return getNissanPackage(model, year, taskType);
  }

  if (makeLower === "toyota") {
    return getToyotaPackage(model, year, taskType);
  }

  return null;
}

export type { SourcePackage, TaskType };
