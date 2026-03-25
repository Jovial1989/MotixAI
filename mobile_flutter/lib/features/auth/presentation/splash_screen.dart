import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth_provider.dart';
import '../../../../app/theme.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../../shared/providers/locale_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    // Check country selection first — gate everything behind it.
    final hasCountry = await LocaleNotifier.hasChosenCountry();
    if (!mounted) return;

    final result = await ref.read(authProvider.notifier).bootstrap();
    if (!mounted) return;

    final String destination;
    switch (result) {
      case AuthBootResult.hasSession:
        destination = '/dashboard';
      case AuthBootResult.needsOnboarding:
        destination = '/onboarding';
      case AuthBootResult.noSession:
        destination = '/login';
    }

    if (!hasCountry) {
      ref.read(hasChosenCountryProvider.notifier).state = false;
      context.go('/country-select?next=$destination');
    } else {
      ref.read(hasChosenCountryProvider.notifier).state = true;
      context.go(destination);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = S.of(context);
    return Scaffold(
      backgroundColor: kPrimary,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: kRadiusXl,
              ),
              child: const Center(
                child: Text('M',
                    style: TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.w900,
                      color: kPrimary,
                    )),
              ),
            ),
            const SizedBox(height: s24),
            Text(l?.appName ?? 'Motixi',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: -0.5,
                )),
            const SizedBox(height: s8),
            Text(l?.aiPoweredRepairGuides ?? 'AI-Powered Repair Guides',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withValues(alpha: 0.7),
                )),
            const SizedBox(height: s48),
            const CircularProgressIndicator(
                color: Colors.white, strokeWidth: 2),
          ],
        ),
      ),
    );
  }
}
