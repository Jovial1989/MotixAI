import 'package:flutter/material.dart';

// ── Brand colours ────────────────────────────────────────────────────────────
const kPrimary       = Color(0xFFEA580C); // orange-600
const kPrimaryLight  = Color(0xFFFFF7ED); // orange-50
const kPrimaryDark   = Color(0xFFC2410C); // orange-700
const kPrimaryBorder = Color(0xFFFDBA74); // orange-300
const kBg            = Color(0xFFF1F5F9); // slate-100
const kBgCard        = Color(0xFFFFFFFF);
const kBgSubtle      = Color(0xFFF8FAFC); // slate-50
const kText          = Color(0xFF0F172A); // slate-900
const kTextSub       = Color(0xFF475569); // slate-600
const kTextMuted     = Color(0xFF94A3B8); // slate-400
const kBorder        = Color(0xFFE2E8F0); // slate-200
const kSuccess       = Color(0xFF16A34A);
const kSuccessLight  = Color(0xFFF0FDF4);
const kSuccessBorder = Color(0xFF86EFAC); // green-300
const kWarning       = Color(0xFFD97706);
const kWarningLight  = Color(0xFFFFFBEB);
const kWarningBorder = Color(0xFFFCD34D); // amber-300
const kError         = Color(0xFFDC2626);
const kErrorLight    = Color(0xFFFEF2F2);

// ── 8pt spacing ──────────────────────────────────────────────────────────────
const double s4  = 4;
const double s8  = 8;
const double s10 = 10;
const double s12 = 12;
const double s14 = 14;
const double s16 = 16;
const double s24 = 24;
const double s32 = 32;
const double s48 = 48;

// ── Touch targets ─────────────────────────────────────────────────────────────
const double kMinTouch = 48;
const double kBtnHeight = 52;

// ── Radius ────────────────────────────────────────────────────────────────────
const kRadiusSm  = BorderRadius.all(Radius.circular(10));
const kRadiusMd  = BorderRadius.all(Radius.circular(14));
const kRadiusLg  = BorderRadius.all(Radius.circular(20));
const kRadiusXl  = BorderRadius.all(Radius.circular(24));
const kRadiusFull= BorderRadius.all(Radius.circular(999));

// ── Card decoration ───────────────────────────────────────────────────────────
BoxDecoration kCardDecoration({Color? borderColor}) => BoxDecoration(
  color: kBgCard,
  borderRadius: kRadiusLg,
  border: Border.all(color: borderColor ?? kBorder),
  boxShadow: const [BoxShadow(color: Color(0x0D0F172A), blurRadius: 6, offset: Offset(0, 2))],
);

// ── Theme ────────────────────────────────────────────────────────────────────
ThemeData buildTheme() => ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: kPrimary,
    brightness: Brightness.light,
    primary: kPrimary,
    onPrimary: Colors.white,
    surface: kBgCard,
    onSurface: kText,
  ),
  scaffoldBackgroundColor: kBg,
  appBarTheme: const AppBarTheme(
    backgroundColor: kBgCard,
    foregroundColor: kText,
    elevation: 0,
    surfaceTintColor: Colors.transparent,
    titleTextStyle: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: kText),
  ),
  cardTheme: const CardThemeData(
    color: kBgCard,
    elevation: 0,
    margin: EdgeInsets.zero,
    shape: RoundedRectangleBorder(borderRadius: kRadiusLg, side: BorderSide(color: kBorder)),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: kBgSubtle,
    contentPadding: const EdgeInsets.symmetric(horizontal: s16, vertical: s16),
    border: OutlineInputBorder(borderRadius: kRadiusMd, borderSide: const BorderSide(color: kBorder, width: 1.5)),
    enabledBorder: OutlineInputBorder(borderRadius: kRadiusMd, borderSide: const BorderSide(color: kBorder, width: 1.5)),
    focusedBorder: OutlineInputBorder(borderRadius: kRadiusMd, borderSide: const BorderSide(color: kPrimary, width: 1.5)),
    errorBorder: OutlineInputBorder(borderRadius: kRadiusMd, borderSide: const BorderSide(color: kError, width: 1.5)),
    hintStyle: const TextStyle(color: kTextMuted, fontSize: 15),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: kPrimary,
      foregroundColor: Colors.white,
      minimumSize: const Size.fromHeight(kBtnHeight),
      shape: const StadiumBorder(),
      textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
    ),
  ),
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(foregroundColor: kPrimary),
  ),
  chipTheme: ChipThemeData(
    backgroundColor: kBgCard,
    side: const BorderSide(color: kBorder),
    shape: const StadiumBorder(),
    labelStyle: const TextStyle(fontSize: 13, color: kText, fontWeight: FontWeight.w500),
    padding: const EdgeInsets.symmetric(horizontal: s12, vertical: s4),
  ),
  dividerTheme: const DividerThemeData(color: kBorder, thickness: 1, space: 0),
  pageTransitionsTheme: const PageTransitionsTheme(builders: {
    TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
    TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
  }),
);

// ── Text styles ───────────────────────────────────────────────────────────────
const tsStepTitle  = TextStyle(fontSize: 26, fontWeight: FontWeight.w700, letterSpacing: -0.4, color: kText);
const tsSectionHead= TextStyle(fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: -0.2, color: kText);
const tsTitle      = TextStyle(fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.3, color: kText);
const tsSubhead    = TextStyle(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: -0.1, color: kText);
const tsBody       = TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: kTextSub, height: 1.5);
const tsBodyBold   = TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: kText);
const tsBodyMd     = TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: kTextSub, height: 1.6);
const tsSmall      = TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: kTextSub);
const tsSmallBold  = TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: kText);
const tsCaption    = TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: kTextMuted);
const tsLabel      = TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.8, color: kTextMuted);
