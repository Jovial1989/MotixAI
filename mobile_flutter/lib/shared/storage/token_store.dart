import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _kAccess          = 'motix_access_token';
const _kRefresh         = 'motix_refresh_token';
const _kOnboardingDone  = 'motix_onboarding_done';

class TokenStore {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<void> save(String access, String? refresh) async {
    await _storage.write(key: _kAccess, value: access);
    if (refresh != null) await _storage.write(key: _kRefresh, value: refresh);
  }

  Future<String?> accessToken()  => _storage.read(key: _kAccess);
  Future<String?> refreshToken() => _storage.read(key: _kRefresh);

  Future<void> saveOnboardingDone(bool done) async {
    await _storage.write(key: _kOnboardingDone, value: done ? 'true' : 'false');
  }

  Future<bool> hasCompletedOnboarding() async {
    final val = await _storage.read(key: _kOnboardingDone);
    return val == 'true';
  }

  Future<void> clear() async {
    await _storage.delete(key: _kAccess);
    await _storage.delete(key: _kRefresh);
    await _storage.delete(key: _kOnboardingDone);
  }
}
