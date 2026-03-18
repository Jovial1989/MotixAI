import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/auth_provider.dart';
import '../features/auth/presentation/splash_screen.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/signup_screen.dart';
import '../features/guides/presentation/dashboard_screen.dart';
import '../features/guides/presentation/guide_detail_screen.dart';
import '../features/guides/presentation/history_screen.dart';
import '../features/onboarding/presentation/onboarding_screen.dart';
import '../features/profile/presentation/profile_screen.dart';

/// Bridges Riverpod's [authProvider] to go_router's ChangeNotifier-based
/// [refreshListenable]. The GoRouter is created once; this notifier tells
/// go_router to re-evaluate its redirect function whenever auth state changes,
/// without recreating the router and resetting the navigation stack.
class _RouterNotifier extends ChangeNotifier {
  final Ref _ref;

  _RouterNotifier(this._ref) {
    _ref.listen<AuthState>(authProvider, (_, __) => notifyListeners());
  }

  String? redirect(BuildContext context, GoRouterState state) {
    final auth = _ref.read(authProvider);
    final isAuthenticated = auth.isAuthenticated;
    final hasCompletedOnboarding = auth.hasCompletedOnboarding;
    final location = state.matchedLocation;

    final authRoutes = ['/login', '/signup'];
    final isOnAuth = authRoutes.contains(location);

    // Splash handles its own redirect via bootstrap()
    if (location == '/') return null;

    // Not authenticated → go to login (unless already on auth screen)
    if (!isAuthenticated && !isOnAuth && location != '/onboarding') {
      return '/login';
    }

    // Authenticated but on auth screen → redirect based on onboarding state
    if (isAuthenticated && isOnAuth) {
      return hasCompletedOnboarding ? '/dashboard' : '/onboarding';
    }

    // Authenticated but hasn't completed onboarding → force to /onboarding
    if (isAuthenticated && !hasCompletedOnboarding && location != '/onboarding') {
      return '/onboarding';
    }

    return null;
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterNotifier(ref);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: notifier.redirect,
    routes: [
      GoRoute(
        path: '/',
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (_, __) => const SignupScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (_, __) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (_, __) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/guides/:id',
        builder: (_, state) => GuideDetailScreen(guideId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/history',
        builder: (_, __) => const HistoryScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (_, __) => const ProfileScreen(),
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('Page not found: ${state.error}')),
    ),
  );
});
