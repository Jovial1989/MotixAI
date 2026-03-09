export type Role = 'USER' | 'ENTERPRISE_ADMIN' | 'GUEST';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Vehicle {
  id: string;
  vin?: string | null;
  model: string;
  manufacturer?: string | null;
  year?: number | null;
}

export interface Part {
  id: string;
  name: string;
  oemNumber?: string | null;
}

export interface RepairStep {
  id: string;
  stepOrder: number;
  title: string;
  instruction: string;
  torqueValue?: string | null;
  warningNote?: string | null;
  imageStatus: 'none' | 'queued' | 'generating' | 'ready' | 'failed';
  imageUrl?: string | null;
  imagePrompt?: string | null;
  imageError?: string | null;
}

export interface GeneratedImage {
  id: string;
  stepOrder: number;
  prompt: string;
  imageUrl?: string | null;
  status: string;
}

export interface RepairGuide {
  id: string;
  title: string;
  difficulty: string;
  timeEstimate: string;
  tools: string[];
  safetyNotes: string[];
  sourceType: 'B2C' | 'ENTERPRISE';
  createdAt: string;
  vehicle: Vehicle;
  part: Part;
  steps: RepairStep[];
  images: GeneratedImage[];
}

export interface ManualDocument {
  id: string;
  title: string;
  fileUrl: string;
  extractedText?: string | null;
  createdAt: string;
}

export interface CreateGuideInput {
  vin?: string;
  vehicleModel?: string;
  partName: string;
  oemNumber?: string;
}

export interface UploadManualInput {
  title: string;
  fileUrl: string;
  extractedText?: string;
  vehicleModel?: string;
}

export interface EnterpriseGuideInput {
  manualId: string;
  vehicleModel: string;
  partName: string;
  oemNumber?: string;
}
