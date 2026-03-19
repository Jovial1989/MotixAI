import type {
  AnalyticsData,
  AuthTokens,
  CreateGuideInput,
  CreateJobInput,
  CreateRequestInput,
  EnterpriseGuideInput,
  ForgotPasswordResponse,
  GenerateImageResponse,
  GuideRequest,
  ManualDocument,
  PlanType,
  RedeemPromoResponse,
  RepairGuide,
  RepairJob,
  SelectPlanResponse,
  SourceGuideInput,
  UpdateJobInput,
  UploadManualInput,
  VehicleWithHistory,
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

    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined as T;
    }
    return (await res.json()) as T;
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  signup(body: { email: string; password: string }) {
    return this.request<AuthTokens>('/auth/signup', { method: 'POST', body: JSON.stringify(body) });
  }

  login(body: { email: string; password: string }) {
    return this.request<AuthTokens>('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  }

  refresh(body: { refreshToken: string }) {
    return this.request<AuthTokens>('/auth/refresh', { method: 'POST', body: JSON.stringify(body) });
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

  // ── User / Onboarding ─────────────────────────────────────────────────────

  selectPlan(planType: PlanType) {
    return this.request<SelectPlanResponse>('/user/select-plan', {
      method: 'POST',
      body: JSON.stringify({ planType }),
    });
  }

  completeOnboarding() {
    return this.request<{ success: boolean }>('/user/onboarding-complete', { method: 'POST' });
  }

  redeemPromo(promoCode: string) {
    return this.request<RedeemPromoResponse>('/user/redeem-promo', {
      method: 'POST',
      body: JSON.stringify({ promoCode }),
    });
  }

  // ── Steps ─────────────────────────────────────────────────────────────────

  generateStepImage(stepId: string, force = false) {
    return this.request<GenerateImageResponse>(`/steps/${stepId}/generate-image`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
  }

  // ── Guides ────────────────────────────────────────────────────────────────

  createGuide(body: CreateGuideInput) {
    return this.request<RepairGuide>('/guides', { method: 'POST', body: JSON.stringify(body) });
  }

  listGuides() {
    return this.request<RepairGuide[]>('/guides');
  }

  getGuide(id: string) {
    return this.request<RepairGuide>(`/guides/${id}`);
  }

  deleteGuide(id: string) {
    return this.request<void>(`/guides/${id}`, { method: 'DELETE' });
  }

  askGuideStep(guideId: string, stepId: string, question: string) {
    return this.request<{ answer: string }>(`/guides/${guideId}/ask`, {
      method: 'POST',
      body: JSON.stringify({ stepId, question }),
    });
  }

  createSourceGuide(body: SourceGuideInput) {
    return this.request<RepairGuide>('/guides/source-backed', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Search stored guides — step 1 of the search → retrieve → generate flow.
   * Works for all authenticated users including GUEST role.
   */
  searchGuides(params: { q?: string; make?: string; model?: string; component?: string }) {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.make) qs.set('make', params.make);
    if (params.model) qs.set('model', params.model);
    if (params.component) qs.set('component', params.component);
    const query = qs.toString();
    return this.request<RepairGuide[]>(`/guides/search${query ? `?${query}` : ''}`);
  }

  // ── Repair Jobs ───────────────────────────────────────────────────────────

  createJob(body: CreateJobInput) {
    return this.request<RepairJob>('/jobs', { method: 'POST', body: JSON.stringify(body) });
  }

  listJobs() {
    return this.request<RepairJob[]>('/jobs');
  }

  updateJob(id: string, body: UpdateJobInput) {
    return this.request<RepairJob>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }

  deleteJob(id: string) {
    return this.request<void>(`/jobs/${id}`, { method: 'DELETE' });
  }

  // ── Guide Requests ────────────────────────────────────────────────────────

  createGuideRequest(body: CreateRequestInput) {
    return this.request<GuideRequest>('/requests', { method: 'POST', body: JSON.stringify(body) });
  }

  listGuideRequests() {
    return this.request<GuideRequest[]>('/requests');
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  getAnalytics() {
    return this.request<AnalyticsData>('/analytics');
  }

  // ── Vehicles ──────────────────────────────────────────────────────────────

  listVehicles() {
    return this.request<VehicleWithHistory[]>('/vehicles');
  }

  // ── Enterprise ────────────────────────────────────────────────────────────

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

  // ── Admin ─────────────────────────────────────────────────────────────────

  adminListRequests() {
    return this.request<GuideRequest[]>('/admin/requests');
  }

  adminUpdateRequest(id: string, status: string, guideId?: string) {
    return this.request<GuideRequest>(`/admin/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, guideId }),
    });
  }

  adminListGuides() {
    return this.request<RepairGuide[]>('/admin/guides');
  }

  adminUpdateGuide(id: string, body: { status?: string; title?: string }) {
    return this.request<RepairGuide>(`/admin/guides/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  adminListUsers() {
    return this.request<Array<{ id: string; email: string; fullName: string; role: string; createdAt: string }>>('/admin/users');
  }
}
