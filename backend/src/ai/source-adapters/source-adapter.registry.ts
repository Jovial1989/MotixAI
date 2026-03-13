import { NissanAdapter } from './nissan.adapter';
import { ToyotaAdapter } from './toyota.adapter';
import { SourceAdapter } from './source-adapter.interface';
import { SourcePackage, TaskType } from './source-package.types';

export class SourceAdapterRegistry {
  private readonly adapters: SourceAdapter[];

  constructor() {
    this.adapters = [new NissanAdapter(), new ToyotaAdapter()];
  }

  getAdapter(make: string): SourceAdapter | null {
    return this.adapters.find((a) => a.make === make.toLowerCase()) ?? null;
  }

  getPackage(
    make: string,
    model: string,
    year: number,
    taskType: TaskType,
  ): SourcePackage | null {
    const adapter = this.getAdapter(make);
    if (!adapter) return null;
    return adapter.getPackage(model, year, taskType);
  }

  listSupportedMakes(): string[] {
    return this.adapters.map((a) => a.make);
  }

  isMakeSupported(make: string): boolean {
    return this.adapters.some((a) => a.make === make.toLowerCase());
  }

  isModelSupported(make: string, model: string): boolean {
    const adapter = this.getAdapter(make);
    return adapter?.supportsModel(model) ?? false;
  }
}
