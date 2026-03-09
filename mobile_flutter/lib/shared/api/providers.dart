import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/token_store.dart';
import '../storage/cache_store.dart';
import 'api_client.dart';

final tokenStoreProvider = Provider<TokenStore>((_) => TokenStore());
final cacheStoreProvider  = Provider<CacheStore>((_) => CacheStore());
final apiClientProvider   = Provider<ApiClient>((ref) =>
    ApiClient(tokenStore: ref.read(tokenStoreProvider)));
