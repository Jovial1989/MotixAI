import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
import '../models/models.dart';
import '../storage/token_store.dart';

// Compile-time constant — pass via --dart-define=API_BASE_URL=http://...
// On Android emulator, localhost is unreachable; use 10.0.2.2 instead.
const String _kEnvBase = String.fromEnvironment('API_BASE_URL');
const String _kProdApiBaseUrl =
    'https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/api';
String get kApiBaseUrl {
  if (_kEnvBase.isNotEmpty) return _kEnvBase;
  // Default mobile builds to the reachable Supabase API. The iOS simulator
  // cannot hit localhost unless the developer explicitly passes a LAN address.
  if (!kIsWeb) return _kProdApiBaseUrl;
  if (Platform.isAndroid) return 'http://10.0.2.2:4000';
  return _kProdApiBaseUrl;
}

class ApiClient {
  late final Dio _dio;
  final TokenStore _tokenStore;

  ApiClient({required TokenStore tokenStore}) : _tokenStore = tokenStore {
    _dio = Dio(BaseOptions(
      baseUrl: kApiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    // ── Auth interceptor ─────────────────────────────────────────────────────
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _tokenStore.accessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Attempt silent refresh
          final refreshToken = await _tokenStore.refreshToken();
          if (refreshToken != null) {
            try {
              final tokens = await _refreshTokens(refreshToken);
              await _tokenStore.save(tokens.accessToken, tokens.refreshToken);
              // Retry original request
              final opts = error.requestOptions;
              opts.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
              final resp = await _dio.fetch(opts);
              return handler.resolve(resp);
            } catch (_) {
              await _tokenStore.clear();
            }
          }
        }
        handler.next(error);
      },
    ));
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  Map<String, dynamic>? _languageQuery(String? language) {
    if (language == null || language.isEmpty) return null;
    return {'language': language};
  }

  String _extractMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map<String, dynamic>) {
      final msg = data['message'];
      if (msg is List) return msg.join(', ');
      if (msg is String) return msg;
    }
    return e.message ?? 'Request failed (${e.response?.statusCode})';
  }

  T _handleError<T>(DioException e) =>
      throw ApiException(_extractMessage(e), e.response?.statusCode);

  // ── Auth ──────────────────────────────────────────────────────────────────────

  Future<AuthTokens> _refreshTokens(String refreshToken) async {
    final resp = await _dio.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
      options: Options(headers: {}), // skip auth interceptor on retry
    );
    return AuthTokens.fromJson(resp.data!);
  }

  Future<AuthTokens> refreshSession() async {
    final refreshToken = await _tokenStore.refreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      throw const ApiException('Missing refresh token');
    }
    try {
      final tokens = await _refreshTokens(refreshToken);
      await _tokenStore.save(tokens.accessToken, tokens.refreshToken);
      return tokens;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<AuthTokens> login(String email, String password) async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      return AuthTokens.fromJson(resp.data!);
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<AuthTokens> signup(String email, String password) async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>(
        '/auth/signup',
        data: {'email': email, 'password': password},
      );
      return AuthTokens.fromJson(resp.data!);
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<AuthTokens> guest() async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>('/auth/guest');
      return AuthTokens.fromJson(resp.data!);
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // ── Guides ────────────────────────────────────────────────────────────────────

  Future<List<RepairGuide>> listGuides({String? language}) async {
    try {
      final resp = await _dio.get<List<dynamic>>(
        '/guides',
        queryParameters: _languageQuery(language),
      );
      return (resp.data ?? [])
          .map((j) => RepairGuide.fromJson(j as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<List<RepairGuide>> getDemoGuides({String? language}) async {
    try {
      final resp = await _dio.get<List<dynamic>>(
        '/guides/demo',
        queryParameters: _languageQuery(language),
      );
      return (resp.data ?? [])
          .map((j) => RepairGuide.fromJson(j as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<RepairGuide> getGuide(String id, {String? language}) async {
    try {
      final resp = await _dio.get<Map<String, dynamic>>(
        '/guides/$id',
        queryParameters: _languageQuery(language),
      );
      return RepairGuide.fromJson(resp.data!);
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<RepairGuide> createGuide({
    String? vehicleModel,
    required String partName,
    String? oemNumber,
    String? language,
  }) async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>('/guides', data: {
        if (vehicleModel != null && vehicleModel.isNotEmpty)
          'vehicleModel': vehicleModel,
        'partName': partName,
        if (oemNumber != null && oemNumber.isNotEmpty) 'oemNumber': oemNumber,
        if (language != null && language.isNotEmpty) 'language': language,
      });
      return RepairGuide.fromJson(resp.data!);
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<void> deleteGuide(String id) async {
    try {
      await _dio.delete('/guides/$id');
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // ── User / Onboarding ────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> selectPlan(String planType) async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>(
        '/user/select-plan',
        data: {'planType': planType},
      );
      return resp.data!;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> completeOnboarding() async {
    try {
      final resp =
          await _dio.post<Map<String, dynamic>>('/user/onboarding-complete');
      return resp.data!;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> redeemPromo(String promoCode) async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>(
        '/user/redeem-promo',
        data: {'promoCode': promoCode},
      );
      return resp.data!;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // ── Billing ────────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> createCheckoutSession(
      Map<String, dynamic> body) async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>(
        '/billing/create-checkout-session',
        data: body,
      );
      return resp.data!;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<Map<String, dynamic>> createPortalSession(
      Map<String, dynamic> body) async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>(
        '/billing/portal-session',
        data: body,
      );
      return resp.data!;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // ── Steps ─────────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> generateStepImage(String stepId,
      {bool force = false}) async {
    try {
      // The backend pipeline (spec + image generation) can take up to ~45s.
      // Override the default 30s receiveTimeout so we get the real final result
      // instead of timing out early and falling back to polling.
      final resp = await _dio.post<Map<String, dynamic>>(
        '/steps/$stepId/generate-image',
        data: {'force': force},
        options: Options(receiveTimeout: const Duration(seconds: 60)),
      );
      return resp.data!;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  Future<String> askGuideStep(String guideId, String stepId, String question,
      {String? language}) async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>(
        '/guides/$guideId/ask',
        data: {
          'stepId': stepId,
          'question': question,
          if (language != null && language.isNotEmpty) 'language': language,
        },
      );
      return resp.data!['answer'] as String? ?? '';
    } on DioException catch (e) {
      return _handleError(e);
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  const ApiException(this.message, [this.statusCode]);

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;

  @override
  String toString() => message;
}
