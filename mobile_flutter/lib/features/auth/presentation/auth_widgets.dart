import 'package:flutter/material.dart';
import '../../../../app/theme.dart';

InputDecoration authInputDecoration(String hint) => InputDecoration(
  hintText: hint,
  hintStyle: const TextStyle(color: kTextMuted, fontSize: 15),
  contentPadding: const EdgeInsets.symmetric(horizontal: s16, vertical: s12),
  filled: true,
  fillColor: Colors.white,
  border: OutlineInputBorder(borderRadius: kRadiusMd, borderSide: const BorderSide(color: kBorder)),
  enabledBorder: OutlineInputBorder(borderRadius: kRadiusMd, borderSide: const BorderSide(color: kBorder)),
  focusedBorder: OutlineInputBorder(borderRadius: kRadiusMd, borderSide: const BorderSide(color: kPrimary, width: 2)),
  errorBorder: OutlineInputBorder(borderRadius: kRadiusMd, borderSide: const BorderSide(color: Color(0xFFDC2626))),
  focusedErrorBorder: OutlineInputBorder(borderRadius: kRadiusMd, borderSide: const BorderSide(color: Color(0xFFDC2626), width: 2)),
);

class AuthErrorBanner extends StatelessWidget {
  final String message;
  const AuthErrorBanner(this.message, {super.key});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(s12),
    decoration: BoxDecoration(
      color: kErrorLight,
      borderRadius: kRadiusMd,
      border: Border.all(color: const Color(0xFFFCA5A5)),
    ),
    child: Row(
      children: [
        const Icon(Icons.error_outline, size: 18, color: Color(0xFFDC2626)),
        const SizedBox(width: s8),
        Expanded(child: Text(message, style: tsCaption.copyWith(color: const Color(0xFFDC2626)))),
      ],
    ),
  );
}
