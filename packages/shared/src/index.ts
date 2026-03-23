export type Role = 'USER' | 'ENTERPRISE_ADMIN' | 'GUEST';

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

export interface SourceGuideInput {
  make: string;
  model: string;
  year: number;
  component: string;
  taskType: TaskType;
}

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

export interface VehicleWithHistory extends Vehicle {
  guides: Array<{ id: string; title: string; createdAt: string; part: { name: string } }>;
  repairJobs: Array<{ id: string; status: string; problemDescription: string; createdAt: string }>;
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
  imageStatus: 'none' | 'queued' | 'searching_refs' | 'analyzing_refs' | 'generating' | 'ready' | 'failed';
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
  canonicalGuideId?: string | null;
  language?: string;
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
  searchKeywords?: string[];
  popularity?: number;
  source?: string | null;
  confidence?: number | null;
  taskType?: string | null;
  sourceProvider?: string | null;
  sourceReferences?: SourceReference[] | null;
}

export interface RepairJob {
  id: string;
  vehicleId: string;
  guideId?: string | null;
  problemDescription: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string | null;
  createdAt: string;
  vehicle: Vehicle;
  guide?: { id: string; title: string; part: Part } | null;
}

export interface GuideRequest {
  id: string;
  vehicleModel: string;
  repairType: string;
  partNumber?: string | null;
  notes?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  guideId?: string | null;
  createdAt: string;
  guide?: { id: string; title: string } | null;
}

export interface AnalyticsData {
  guidesThisMonth: number;
  timeSavedMinutes: number;
  activeVehicles: number;
  mostCommonRepairs: Array<{ partName: string; count: number }>;
  recentActivity: Array<{ id: string; type: 'guide' | 'job'; title: string; createdAt: string }>;
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

export interface CreateJobInput {
  vehicleId: string;
  guideId?: string;
  problemDescription: string;
  assignedTechnicianId?: string;
  notes?: string;
}

export interface UpdateJobInput {
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
}

export interface CreateRequestInput {
  vehicleModel: string;
  repairType: string;
  partNumber?: string;
  notes?: string;
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
