export type TaskType =
  | 'oil_change'
  | 'brake_pad_replacement'
  | 'brake_fluid_flush'
  | 'timing_belt'
  | 'coolant_flush';

export interface SourceReference {
  title: string;
  url: string;
  excerpt: string;
}

export interface SourceStep {
  order: number;
  title: string;
  rawText: string;
  torqueSpec?: string;
  warningNote?: string;
}

export interface SourcePackage {
  make: string;
  model: string;
  year: number;
  component: string;
  taskType: TaskType;
  difficulty: string;
  timeEstimate: string;
  tools: string[];
  safetyNotes: string[];
  sourceProvider: string;
  sourceReferences: SourceReference[];
  steps: SourceStep[];
}
