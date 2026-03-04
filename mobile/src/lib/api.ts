import Constants from 'expo-constants';
import { MotixApiClient } from '@motixai/api-client';
import { tokenStore } from '../store/authStore';

const baseUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  'http://localhost:4000';

export const mobileApi = new MotixApiClient({
  baseUrl,
  getAccessToken: () => null,
});

export async function authApi() {
  const token = await tokenStore.accessToken();
  return new MotixApiClient({
    baseUrl,
    getAccessToken: () => token,
  });
}
