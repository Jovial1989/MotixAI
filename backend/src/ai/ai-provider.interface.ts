export interface GuideGenerationInput {
  vehicle: string;
  part: string;
  context?: string;
}

export interface GeneratedStep {
  order: number;
  title: string;
  instruction: string;
  torqueValue?: string;
  warningNote?: string;
}

export interface GeneratedGuide {
  title: string;
  difficulty: string;
  timeEstimate: string;
  tools: string[];
  safetyNotes: string[];
  steps: GeneratedStep[];
  imagePlan: string[];
}

export interface ExplainStepInput {
  stepTitle: string;
  instruction: string;
  vehicleModel: string;
  partName: string;
  question: string;
}

export interface AIProvider {
  generateRepairGuide(input: GuideGenerationInput): Promise<GeneratedGuide>;
  explainStep(input: ExplainStepInput): Promise<string>;
}

export interface AIImageProvider {
  generateImage(prompt: string): Promise<{ imageUrl: string }>;
}

// Extension point for future video generation.
export interface AIVideoProvider {
  generateVideoStoryboard?(prompt: string): Promise<{ storyboardUrl: string }>;
}
