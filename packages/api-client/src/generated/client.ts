import type {
  AuthTokens,
  CreateGuideInput,
  EnterpriseGuideInput,
  ForgotPasswordResponse,
  GenerateImageResponse,
  ManualDocument,
  RepairGuide,
  UploadManualInput,
} from './types';

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null;
}

export class MotixApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const accessToken = this.options.getAccessToken?.();
    const res = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      let message = `Request failed: ${res.status}`;
      try {
        const json = JSON.parse(text) as { message?: string | string[] };
        if (json.message) {
          message = Array.isArray(json.message) ? json.message.join(', ') : json.message;
        }
      } catch {
        if (text) message = text;
      }
      throw new Error(message);
    }

    return (await res.json()) as T;
  }

  signup(body: { email: string; password: string }) {
    return this.request<AuthTokens>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  login(body: { email: string; password: string }) {
    return this.request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  refresh(body: { refreshToken: string }) {
    return this.request<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  guest() {
    return this.request<AuthTokens>('/auth/guest', { method: 'POST' });
  }

  forgotPassword(email: string) {
    return this.request<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  resetPassword(resetToken: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  }

  generateStepImage(stepId: string, force = false) {
    return this.request<GenerateImageResponse>(`/steps/${stepId}/generate-image`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
  }

  createGuide(body: CreateGuideInput) {
    return this.request<RepairGuide>('/guides', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  listGuides() {
    return this.request<RepairGuide[]>('/guides');
  }

  getGuide(id: string) {
    return this.request<RepairGuide>(`/guides/${id}`);
  }

  uploadManual(body: UploadManualInput) {
    return this.request<ManualDocument>('/enterprise/manuals', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  listManuals() {
    return this.request<ManualDocument[]>('/enterprise/manuals');
  }

  createEnterpriseGuide(body: EnterpriseGuideInput) {
    return this.request<RepairGuide>('/enterprise/guides', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}
