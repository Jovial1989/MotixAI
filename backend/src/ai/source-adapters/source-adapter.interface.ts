import { SourcePackage, TaskType } from './source-package.types';

export interface SourceAdapter {
  readonly make: string;
  supportsModel(model: string): boolean;
  getPackage(model: string, year: number, taskType: TaskType): SourcePackage | null;
}
