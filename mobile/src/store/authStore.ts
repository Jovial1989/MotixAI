import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'motix_access_token';
const REFRESH_KEY = 'motix_refresh_token';

export const tokenStore = {
  async save(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  },
  async accessToken() {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
