import 'package:dio/dio.dart';
import '../models/models.dart';
import '../storage/token_store.dart';

// Compile-time constant — pass via --dart-define=API_BASE_URL=http://...
const String _kDefaultBase = 'http://localhost:4000';
const String kApiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: _kDefaultBase);

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

  String _extractMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map<String, dynamic>) {
      final msg = data['message'];
      if (msg is List) return msg.join(', ');
      if (msg is String) return msg;
    }
    return e.message ?? 'Request failed (${e.response?.statusCode})';
  }

  T _handleError<T>(DioException e) => throw ApiException(_extractMessage(e), e.response?.statusCode);

  // ── Auth ──────────────────────────────────────────────────────────────────────

  Future<AuthTokens> _refreshTokens(String refreshToken) async {
    final resp = await _dio.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
      options: Options(headers: {}), // skip auth interceptor on retry
    );
    return AuthTokens.fromJson(resp.data!);
  }

  Future<AuthTokens> login(String email, String password) async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>(
        '/auth/login', data: {'email': email, 'password': password},
      );
      return AuthTokens.fromJson(resp.data!);
    } on DioException catch (e) { return _handleError(e); }
  }

  Future<AuthTokens> signup(String email, String password) async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>(
        '/auth/signup', data: {'email': email, 'password': password},
      );
      return AuthTokens.fromJson(resp.data!);
    } on DioException catch (e) { return _handleError(e); }
  }

  Future<AuthTokens> guest() async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>('/auth/guest');
      return AuthTokens.fromJson(resp.data!);
    } on DioException catch (e) { return _handleError(e); }
  }

  // ── Guides ────────────────────────────────────────────────────────────────────

  Future<List<RepairGuide>> listGuides() async {
    try {
      final resp = await _dio.get<List<dynamic>>('/guides');
      return (resp.data ?? [])
          .map((j) => RepairGuide.fromJson(j as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) { return _handleError(e); }
  }

  Future<RepairGuide> getGuide(String id) async {
    try {
      final resp = await _dio.get<Map<String, dynamic>>('/guides/$id');
      return RepairGuide.fromJson(resp.data!);
    } on DioException catch (e) { return _handleError(e); }
  }

  Future<RepairGuide> createGuide({
    String? vin,
    String? vehicleModel,
    required String partName,
    String? oemNumber,
  }) async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>('/guides', data: {
        if (vin != null && vin.isNotEmpty) 'vin': vin,
        if (vehicleModel != null && vehicleModel.isNotEmpty) 'vehicleModel': vehicleModel,
        'partName': partName,
        if (oemNumber != null && oemNumber.isNotEmpty) 'oemNumber': oemNumber,
      });
      return RepairGuide.fromJson(resp.data!);
    } on DioException catch (e) { return _handleError(e); }
  }

  Future<void> deleteGuide(String id) async {
    try { await _dio.delete('/guides/$id'); }
    on DioException catch (e) { return _handleError(e); }
  }

  // ── Steps ─────────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> generateStepImage(String stepId, {bool force = false}) async {
    try {
      final resp = await _dio.post<Map<String, dynamic>>(
        '/steps/$stepId/generate-image',
        data: {'force': force},
      );
      return resp.data!;
    } on DioException catch (e) { return _handleError(e); }
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  const ApiException(this.message, [this.statusCode]);

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden    => statusCode == 403;

  @override
  String toString() => message;
}
