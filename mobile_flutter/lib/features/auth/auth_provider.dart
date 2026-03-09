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
  AuthState copyWith({AuthTokens? tokens, bool? isLoading, String? error, bool clearError = false}) =>
      AuthState(
        tokens: tokens ?? this.tokens,
        isLoading: isLoading ?? this.isLoading,
        error: clearError ? null : (error ?? this.error),
      );
  AuthState withLoading()    => copyWith(isLoading: true, clearError: true);
  AuthState withError(String e) => copyWith(isLoading: false, error: e);
}

// ── Notifier ──────────────────────────────────────────────────────────────────

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api;
  final TokenStore _tokens;
  final CacheStore _cache;

  AuthNotifier(this._api, this._tokens, this._cache) : super(const AuthState());

  /// Called on app boot — loads persisted tokens.
  Future<AuthBootResult> bootstrap() async {
    final access  = await _tokens.accessToken();
    final refresh = await _tokens.refreshToken();
    if (access == null) return AuthBootResult.noSession;

    // Optimistically assume valid; on 401 the Dio interceptor will refresh.
    // We decode the email/role from the JWT claims for display purposes only.
    try {
      final claims = _decodeJwt(access);
      final user = AuthUser(
        id: claims['sub'] as String? ?? '',
        email: claims['email'] as String? ?? '',
        role: claims['role'] as String? ?? 'USER',
        tenantId: claims['tenantId'] as String?,
      );
      state = AuthState(tokens: AuthTokens(
        accessToken: access, refreshToken: refresh, user: user,
      ));
      return AuthBootResult.hasSession;
    } catch (_) {
      return AuthBootResult.noSession;
    }
  }

  Future<void> login(String email, String password) async {
    state = state.withLoading();
    try {
      final tokens = await _api.login(email, password);
      await _tokens.save(tokens.accessToken, tokens.refreshToken);
      state = AuthState(tokens: tokens);
    } catch (e) {
      state = state.withError(e.toString());
    }
  }

  Future<void> signup(String email, String password) async {
    state = state.withLoading();
    try {
      final tokens = await _api.signup(email, password);
      await _tokens.save(tokens.accessToken, tokens.refreshToken);
      state = AuthState(tokens: tokens);
    } catch (e) {
      state = state.withError(e.toString());
    }
  }

  Future<void> logout() async {
    await _tokens.clear();
    await _cache.clearAll();
    state = const AuthState();
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
    // Dart's base64 decoder
    final decoded = String.fromCharCodes(
        base64DecodeBytes(payload));
    return (decoded.isNotEmpty) ? _jsonDecode(decoded) : {};
  }

  List<int> base64DecodeBytes(String s) {
    // Use dart:convert via the codec
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
    while (chunk.length < 4) chunk += '=';
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
      // Simple JSON parse using dart:core
      // We only need top-level string/null values
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

enum AuthBootResult { hasSession, noSession }

// ── Provider ──────────────────────────────────────────────────────────────────

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.read(apiClientProvider),
    ref.read(tokenStoreProvider),
    ref.read(cacheStoreProvider),
  );
});
