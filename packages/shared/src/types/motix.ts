// MotixAI domain types

export type UserRole = 'user' | 'enterprise_admin' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  enterpriseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Vehicle

export interface VehicleModel {
  id: string;
  make: string;
  model: string;
  year?: number;
  vin?: string;
}

// Part

export interface Part {
  id: string;
  name: string;
  oemNumber?: string;
  category?: string;
}

// Repair Guide

export type GuideStatus = 'pending' | 'generating' | 'ready' | 'failed';
export type GuideDifficulty = 'easy' | 'medium' | 'hard';

export interface GuideStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
  warning?: string;
}

export interface RepairGuide {
  id: string;
  title: string;
  status: GuideStatus;
  difficulty?: GuideDifficulty;
  estimatedTime?: string;
  safetyNotes: string[];
  tools: string[];
  materials: string[];
  steps: GuideStep[];
  images: string[];
  oemSummary?: string;
  vehicle: VehicleModel;
  part: Part;
  userId: string;
  createdAt: string;
}

export interface GuideRequest {
  vin?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  partName?: string;
  partOem?: string;
}

// Favorites

export interface Favorite {
  id: string;
  guideId: string;
  guide: RepairGuide;
  createdAt: string;
}

// Search History

export interface SearchHistoryItem {
  id: string;
  query: string;
  vehicle?: VehicleModel;
  part?: Part;
  guideId?: string;
  createdAt: string;
}

// Enterprise

export interface Enterprise {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Manual {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  vehicleModel?: string;
  indexed: boolean;
  enterpriseId: string;
  createdAt: string;
}
