import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'router.dart';
import 'theme.dart';

class MotixApp extends ConsumerWidget {
  const MotixApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Motixi',
      theme: buildTheme(),
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
