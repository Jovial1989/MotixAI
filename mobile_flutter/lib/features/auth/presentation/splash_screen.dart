import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth_provider.dart';
import '../../../../app/theme.dart';

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
    final result = await ref.read(authProvider.notifier).bootstrap();
    if (!mounted) return;
    switch (result) {
      case AuthBootResult.hasSession:
        context.go('/dashboard');
      case AuthBootResult.needsOnboarding:
        context.go('/onboarding');
      case AuthBootResult.noSession:
        context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
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
                child: Text('M', style: TextStyle(
                  fontSize: 40, fontWeight: FontWeight.w900, color: kPrimary,
                )),
              ),
            ),
            const SizedBox(height: s24),
            const Text('MotixAI', style: TextStyle(
              fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white,
              letterSpacing: -0.5,
            )),
            const SizedBox(height: s8),
            Text('AI-Powered Repair Guides', style: TextStyle(
              fontSize: 14, fontWeight: FontWeight.w500,
              color: Colors.white.withOpacity(0.7),
            )),
            const SizedBox(height: s48),
            const CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
          ],
        ),
      ),
    );
  }
}
