import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:motixai_flutter/app/app.dart';

void main() {
  testWidgets('App smoke test — MotixAI renders without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: MotixApp()),
    );
    // The splash screen should appear on boot
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
