import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { MotixApiClient } from '@motixai/api-client';
import { tokenStore } from '../store/authStore';

const rawUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  'http://localhost:4000';

// Android emulator: localhost → 10.0.2.2 (host machine)
const baseUrl =
  Platform.OS === 'android' ? rawUrl.replace('localhost', '10.0.2.2') : rawUrl;

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
