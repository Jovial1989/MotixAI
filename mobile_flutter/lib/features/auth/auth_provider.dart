import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/api/api_client.dart';
import '../../shared/api/providers.dart';
import '../../shared/models/models.dart';
import '../../shared/storage/token_store.dart';
import '../../shared/storage/cache_store.dart';

// ── State ─────────────────────────────────────────────────────────────────────

class AuthState {
  final AuthTokens? tokens;
  final bool isLoading;
  final String? error;

  const AuthState({this.tokens, this.isLoading = false, this.error});

  bool get isAuthenticated => tokens != null;

  /// Whether the user has completed onboarding. Guests always skip onboarding.
  bool get hasCompletedOnboarding =>
      tokens?.user.hasCompletedOnboarding ?? false;

  AuthState copyWith({AuthTokens? tokens, bool? isLoading, String? error, bool clearError = false}) =>
      AuthState(
        tokens: tokens ?? this.tokens,
        isLoading: isLoading ?? this.isLoading,
        error: clearError ? null : (error ?? this.error),
      );
  AuthState withLoading()       => copyWith(isLoading: true, clearError: true);
  AuthState withError(String e) => copyWith(isLoading: false, error: e);
}

// ── Notifier ──────────────────────────────────────────────────────────────────

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api;
  final TokenStore _tokens;
  final CacheStore _cache;

  AuthNotifier(this._api, this._tokens, this._cache) : super(const AuthState());

  Future<void> _persistTokens(AuthTokens tokens) async {
    await _tokens.save(tokens.accessToken, tokens.refreshToken);
    await _tokens.saveOnboardingDone(tokens.user.hasCompletedOnboarding);
    await _tokens.savePlan(
      tokens.user.planType,
      tokens.user.subscriptionStatus,
      tokens.user.trialEndsAt,
    );
  }

  /// Called on app boot — loads persisted tokens and onboarding status.
  Future<AuthBootResult> bootstrap() async {
    final access  = await _tokens.accessToken();
    final refresh = await _tokens.refreshToken();
    if (access == null) return AuthBootResult.noSession;

    try {
      final claims = _decodeJwt(access);
      final onboardingDone = await _tokens.hasCompletedOnboarding();
      final planType = await _tokens.planType();
      final subStatus = await _tokens.subStatus();
      final trialEndsAt = await _tokens.trialEndsAt();
      final user = AuthUser(
        id: claims['sub'] as String? ?? '',
        email: claims['email'] as String? ?? '',
        role: claims['role'] as String? ?? 'USER',
        tenantId: claims['tenantId'] as String?,
        hasCompletedOnboarding: onboardingDone,
        planType: planType,
        subscriptionStatus: subStatus,
        trialEndsAt: trialEndsAt,
      );
      state = AuthState(tokens: AuthTokens(
        accessToken: access, refreshToken: refresh, user: user,
      ));
      return onboardingDone
          ? AuthBootResult.hasSession
          : AuthBootResult.needsOnboarding;
    } catch (_) {
      return AuthBootResult.noSession;
    }
  }

  Future<void> login(String email, String password) async {
    state = state.withLoading();
    try {
      final tokens = await _api.login(email, password);
      await _persistTokens(tokens);
      state = AuthState(tokens: tokens);
    } catch (e) {
      state = state.withError(e.toString());
    }
  }

  Future<void> signup(String email, String password) async {
    state = state.withLoading();
    try {
      final tokens = await _api.signup(email, password);
      await _persistTokens(tokens);
      state = AuthState(tokens: tokens);
    } catch (e) {
      state = state.withError(e.toString());
    }
  }

  /// Update plan state in-memory and persist it (called after promo redemption).
  Future<void> updatePlan(String planType, String subStatus, [String? trialEndsAt]) async {
    final current = state.tokens;
    if (current == null) return;
    await _tokens.savePlan(planType, subStatus, trialEndsAt);
    final updatedUser = AuthUser(
      id: current.user.id,
      email: current.user.email,
      role: current.user.role,
      tenantId: current.user.tenantId,
      hasCompletedOnboarding: current.user.hasCompletedOnboarding,
      planType: planType,
      trialEndsAt: trialEndsAt,
      subscriptionStatus: subStatus,
    );
    state = state.copyWith(
      tokens: AuthTokens(
        accessToken: current.accessToken,
        refreshToken: current.refreshToken,
        user: updatedUser,
      ),
    );
  }

  Future<void> loginAsGuest() async {
    state = state.withLoading();
    try {
      final tokens = await _api.guest();
      await _tokens.save(tokens.accessToken, tokens.refreshToken);
      await _tokens.saveOnboardingDone(true); // guests skip onboarding
      await _tokens.savePlan(tokens.user.planType, tokens.user.subscriptionStatus, null);
      final guestUser = AuthUser(
        id: tokens.user.id,
        email: tokens.user.email,
        role: tokens.user.role,
        tenantId: tokens.user.tenantId,
        hasCompletedOnboarding: true,
        planType: tokens.user.planType,
        subscriptionStatus: tokens.user.subscriptionStatus,
        trialEndsAt: null,
      );
      state = AuthState(tokens: AuthTokens(
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: guestUser,
      ));
    } catch (e) {
      state = state.withError(e.toString());
    }
  }

  Future<void> logout() async {
    await _tokens.clear();
    await _cache.clearAll();
    state = const AuthState();
  }

  /// Called after onboarding is completed — flips the in-memory flag so the
  /// router immediately navigates to /dashboard without needing a full restart.
  void markOnboardingComplete() {
    final current = state.tokens;
    if (current == null) return;
    final updatedUser = AuthUser(
      id: current.user.id,
      email: current.user.email,
      role: current.user.role,
      tenantId: current.user.tenantId,
      hasCompletedOnboarding: true,
      planType: current.user.planType,
      trialEndsAt: current.user.trialEndsAt,
      subscriptionStatus: current.user.subscriptionStatus,
    );
    state = state.copyWith(
      tokens: AuthTokens(
        accessToken: current.accessToken,
        refreshToken: current.refreshToken,
        user: updatedUser,
      ),
    );
  }

  Future<AuthTokens?> refreshSession() async {
    final current = state.tokens;
    if (current == null) return null;
    try {
      final tokens = await _api.refreshSession();
      await _persistTokens(tokens);
      state = AuthState(tokens: tokens);
      return tokens;
    } catch (e) {
      state = state.withError(e.toString());
      return null;
    }
  }

  void clearError() => state = state.copyWith(clearError: true);

  // ── JWT decode (payload only, no verification) ────────────────────────────
  Map<String, dynamic> _decodeJwt(String token) {
    final parts = token.split('.');
    if (parts.length < 2) return {};
    var payload = parts[1];
    payload = payload.replaceAll('-', '+').replaceAll('_', '/');
    final pad = payload.length % 4;
    if (pad != 0) payload = payload.padRight(payload.length + (4 - pad), '=');
    final decoded = String.fromCharCodes(base64DecodeBytes(payload));
    return (decoded.isNotEmpty) ? _jsonDecode(decoded) : {};
  }

  List<int> base64DecodeBytes(String s) {
    final bytes = <int>[];
    for (var i = 0; i < s.length; i += 4) {
      final chunk = s.substring(i, i + 4 > s.length ? s.length : i + 4);
      bytes.addAll(_base64ChunkDecode(chunk));
    }
    return bytes;
  }

  List<int> _base64ChunkDecode(String chunk) {
    const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    int decode(String c) {
      if (c == '=') return 0;
      final i = table.indexOf(c);
      return i < 0 ? 0 : i;
    }
    while (chunk.length < 4) {
      chunk += '=';
    }
    final b0 = decode(chunk[0]);
    final b1 = decode(chunk[1]);
    final b2 = decode(chunk[2]);
    final b3 = decode(chunk[3]);
    final n = (b0 << 18) | (b1 << 12) | (b2 << 6) | b3;
    final res = [(n >> 16) & 0xFF];
    if (chunk[2] != '=') res.add((n >> 8) & 0xFF);
    if (chunk[3] != '=') res.add(n & 0xFF);
    return res;
  }

  Map<String, dynamic> _jsonDecode(String s) {
    try {
      final result = <String, dynamic>{};
      final cleaned = s.trim().replaceFirst('{', '').replaceAll(RegExp(r'\}$'), '');
      final pairs = _splitJsonPairs(cleaned);
      for (final pair in pairs) {
        final colonIdx = pair.indexOf(':');
        if (colonIdx < 0) continue;
        final key = pair.substring(0, colonIdx).trim().replaceAll('"', '');
        final val = pair.substring(colonIdx + 1).trim();
        if (val == 'null') {
          result[key] = null;
        } else if (val.startsWith('"')) {
          result[key] = val.replaceAll('"', '');
        } else if (val == 'true') {
          result[key] = true;
        } else if (val == 'false') {
          result[key] = false;
        } else {
          result[key] = num.tryParse(val) ?? val;
        }
      }
      return result;
    } catch (_) {
      return {};
    }
  }

  List<String> _splitJsonPairs(String s) {
    final result = <String>[];
    var depth = 0;
    var start = 0;
    for (var i = 0; i < s.length; i++) {
      if (s[i] == '{' || s[i] == '[') depth++;
      if (s[i] == '}' || s[i] == ']') depth--;
      if (s[i] == ',' && depth == 0) {
        result.add(s.substring(start, i).trim());
        start = i + 1;
      }
    }
    if (start < s.length) result.add(s.substring(start).trim());
    return result;
  }
}

enum AuthBootResult { hasSession, noSession, needsOnboarding }

// ── Provider ──────────────────────────────────────────────────────────────────

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.read(apiClientProvider),
    ref.read(tokenStoreProvider),
    ref.read(cacheStoreProvider),
  );
});
