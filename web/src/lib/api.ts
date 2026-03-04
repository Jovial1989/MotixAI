import { MotixApiClient } from '@motixai/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const webApi = new MotixApiClient({
  baseUrl,
  getAccessToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('motix_access_token');
  },
});
