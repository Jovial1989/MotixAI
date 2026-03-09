export type Role = 'USER' | 'ENTERPRISE_ADMIN' | 'GUEST';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string | null;
  user: AuthUser;
}

export interface Vehicle {
  id: string;
  model: string;
}

export interface Part {
  id: string;
  name: string;
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

export interface GenerateImageResponse {
  imageStatus: string;
  imageUrl: string | null;
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

export interface LoginInput {
  email: string;
  password: string;
}

export type SignupInput = LoginInput;

export interface RefreshInput {
  refreshToken: string;
}

export interface ForgotPasswordResponse {
  resetToken: string | null;
  message: string;
}

export interface ResetPasswordInput {
  resetToken: string;
  newPassword: string;
}

export type OpenApiPaths = {
  '/auth/signup': { post: { body: SignupInput; response: AuthTokens } };
  '/auth/login': { post: { body: LoginInput; response: AuthTokens } };
  '/auth/refresh': { post: { body: RefreshInput; response: AuthTokens } };
  '/guides': {
    post: { body: CreateGuideInput; response: RepairGuide };
    get: { response: RepairGuide[] };
  };
  '/guides/:id': { get: { response: RepairGuide } };
  '/enterprise/manuals': {
    post: { body: UploadManualInput; response: ManualDocument };
    get: { response: ManualDocument[] };
  };
  '/enterprise/guides': {
    post: { body: EnterpriseGuideInput; response: RepairGuide };
  };
};
