import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _kAccess          = 'motix_access_token';
const _kRefresh         = 'motix_refresh_token';
const _kOnboardingDone  = 'motix_onboarding_done';
const _kPlanType        = 'motix_plan_type';
const _kSubStatus       = 'motix_sub_status';
const _kTrialEndsAt     = 'motix_trial_ends_at';

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

  Future<void> savePlan(String planType, String subStatus, String? trialEndsAt) async {
    await _storage.write(key: _kPlanType, value: planType);
    await _storage.write(key: _kSubStatus, value: subStatus);
    if (trialEndsAt != null) {
      await _storage.write(key: _kTrialEndsAt, value: trialEndsAt);
    } else {
      await _storage.delete(key: _kTrialEndsAt);
    }
  }

  Future<String> planType() async => await _storage.read(key: _kPlanType) ?? 'free';
  Future<String> subStatus() async => await _storage.read(key: _kSubStatus) ?? 'none';
  Future<String?> trialEndsAt() async => _storage.read(key: _kTrialEndsAt);

  Future<void> clear() async {
    await _storage.delete(key: _kAccess);
    await _storage.delete(key: _kRefresh);
    await _storage.delete(key: _kOnboardingDone);
    await _storage.delete(key: _kPlanType);
    await _storage.delete(key: _kSubStatus);
    await _storage.delete(key: _kTrialEndsAt);
  }
}
