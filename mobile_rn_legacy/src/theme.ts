/**
 * MotixAI Design System
 * 8pt spacing grid · 48px min touch targets · WCAG AA contrast
 * Optimised for field conditions: bright sunlight, gloves, one-hand use
 */

// ─── Colors ──────────────────────────────────────────────────────────────────
export const C = {
  // Brand
  primary:       '#EA580C', // orange-600
  primaryLight:  '#FFF7ED', // orange-50
  primaryMid:    '#FFEDD5', // orange-100
  primaryBorder: '#FED7AA', // orange-200
  primaryDark:   '#C2410C', // orange-700

  // Backgrounds
  bg:            '#F1F5F9', // slate-100
  bgCard:        '#FFFFFF',
  bgSubtle:      '#F8FAFC', // slate-50
  bgOverlay:     'rgba(15,23,42,0.04)',

  // Text
  text:          '#0F172A', // slate-900
  textSub:       '#475569', // slate-600
  textMuted:     '#94A3B8', // slate-400
  textInverse:   '#FFFFFF',

  // Borders
  border:        '#E2E8F0', // slate-200
  borderStrong:  '#CBD5E1', // slate-300

  // Semantic
  success:       '#16A34A',
  successLight:  '#F0FDF4',
  successBorder: '#BBF7D0',
  warning:       '#D97706',
  warningLight:  '#FFFBEB',
  warningBorder: '#FDE68A',
  error:         '#DC2626',
  errorLight:    '#FEF2F2',
  errorBorder:   '#FECACA',

  // Neutral surfaces
  surface1:      '#FFFFFF',
  surface2:      '#F8FAFC',
  surface3:      '#F1F5F9',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const T = {
  display:  { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 38, color: C.text },
  title:    { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 30, color: C.text },
  heading:  { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 24, color: C.text },
  subhead:  { fontSize: 15, fontWeight: '600' as const, letterSpacing: -0.1, lineHeight: 22, color: C.text },
  body:     { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, color: C.textSub },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22, color: C.text },
  small:    { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, color: C.textSub },
  smallBold:{ fontSize: 13, fontWeight: '600' as const, lineHeight: 18, color: C.textSub },
  caption:  { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6, lineHeight: 16, color: C.textMuted },
  label:    { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, lineHeight: 14, color: C.textMuted, textTransform: 'uppercase' as const },
} as const;

// ─── Spacing (8pt grid) ───────────────────────────────────────────────────────
export const S = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl: 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const R = {
  xs:   6,
  sm:  10,
  md:  14,
  lg:  20,
  xl:  28,
  full: 999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const SHADOW = {
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// ─── Component tokens ─────────────────────────────────────────────────────────
export const BTN_HEIGHT   = 52;   // primary CTA
export const BTN_HEIGHT_SM = 40;  // secondary
export const INPUT_HEIGHT  = 52;
export const HEADER_HEIGHT = 56;
export const SCREEN_H_PAD  = 20;
export const CARD_RADIUS   = R.lg;
export const INPUT_RADIUS  = R.md;
