export const APP_NAME = 'MotixAI';
export const APP_VERSION = '1.0.0';

export const API_VERSION = 'v1';

export const AI_MODELS = {
  CLAUDE_SONNET: 'claude-sonnet-4-6',
  CLAUDE_HAIKU: 'claude-haiku-4-5-20251001',
  CLAUDE_OPUS: 'claude-opus-4-6',
} as const;

export const DEFAULT_MODEL = AI_MODELS.CLAUDE_SONNET;

export const ROLES = {
  USER: 'user',
  ENTERPRISE_ADMIN: 'enterprise_admin',
  ADMIN: 'admin',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
} as const;

export const GUIDE_STATUS = {
  PENDING: 'pending',
  GENERATING: 'generating',
  READY: 'ready',
  FAILED: 'failed',
} as const;

export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;
