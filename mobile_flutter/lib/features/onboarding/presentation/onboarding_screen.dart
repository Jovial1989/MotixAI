import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../shared/api/providers.dart';
import '../../../shared/storage/token_store.dart';
import '../../auth/auth_provider.dart';

// ── Data ─────────────────────────────────────────────────────────────────────

class _InfoStep {
  final String emoji;
  final String heading;
  final String sub;
  final List<_Feature>? features;
  const _InfoStep(this.emoji, this.heading, this.sub, [this.features]);
}

class _Feature {
  final String icon;
  final String title;
  final String desc;
  const _Feature(this.icon, this.title, this.desc);
}

const _infoSteps = [
  _InfoStep(
    '🔧',
    'Welcome to Motixi',
    'AI-powered repair guides that know your vehicle, your parts, and your job — all in one place.',
  ),
  _InfoStep(
    '⚡',
    'Everything you need to fix it right',
    'From oil changes to timing belts — precise, step-by-step guides with AI illustrations.',
    [
      _Feature('📋', 'Step-by-step guides', 'Auto-generated from OEM data and trusted sources'),
      _Feature('🖼️', 'AI illustrations', 'Visual reference for every repair step'),
      _Feature('💬', 'Ask the guide', 'Get instant answers to repair questions'),
    ],
  ),
];

class _Plan {
  final String id;
  final String emoji;
  final String name;
  final String desc;
  final bool recommended;
  const _Plan(this.id, this.emoji, this.name, this.desc, {this.recommended = false});
}

const _plans = [
  _Plan('trial', '🚀', '7-day free trial',
      'Full access — AI illustrations, OEM-backed guides, unlimited repairs. No card required.',
      recommended: true),
  _Plan('premium', '⭐', 'Premium',
      'Full access immediately. Best for shops and serious techs.'),
  _Plan('free', '🔓', 'Free (limited)',
      'Basic guide generation. No AI illustrations, limited history.'),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int _step = 0;
  String _selectedPlan = 'trial';
  bool _loading = false;
  String? _error;

  static const _totalSteps = 3; // 2 info + 1 plan

  bool get _isLastStep => _step == _totalSteps - 1;

  Future<void> _finish() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = ref.read(apiClientProvider);
      await api.selectPlan(_selectedPlan);
      await api.completeOnboarding();
      await ref.read(tokenStoreProvider).saveOnboardingDone(true);
      ref.read(authProvider.notifier).markOnboardingComplete();
      if (mounted) context.go('/dashboard');
    } catch (e) {
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  void _next() {
    if (_isLastStep) {
      _finish();
    } else {
      setState(() => _step++);
    }
  }

  String get _ctaLabel {
    if (_isLastStep) {
      if (_selectedPlan == 'trial') return 'Start my free trial';
      if (_selectedPlan == 'premium') return 'Get Premium access';
      return 'Continue free';
    }
    return 'Continue';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: s24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: s32),
              // Logo
              Row(children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(color: kPrimary, borderRadius: kRadiusSm),
                  child: const Center(
                    child: Text('M', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
                  ),
                ),
                const SizedBox(width: 10),
                const Text('Motixi', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: kText, letterSpacing: -0.4)),
              ]),
              const SizedBox(height: s32),
              // Step dots
              Row(children: [
                for (int i = 0; i < _totalSteps; i++) ...[
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    width: i == _step ? 24 : 8, height: 8,
                    decoration: BoxDecoration(
                      color: i < _step ? kPrimaryDark : i == _step ? kPrimary : kBorder,
                      borderRadius: kRadiusFull,
                    ),
                  ),
                  if (i < _totalSteps - 1) const SizedBox(width: 6),
                ],
              ]),
              const SizedBox(height: s32),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  child: _step < 2 ? _InfoStepWidget(step: _infoSteps[_step]) : _PlanStepWidget(
                    selectedPlan: _selectedPlan,
                    onSelect: (p) => setState(() => _selectedPlan = p),
                    error: _error,
                  ),
                ),
              ),

              const SizedBox(height: s16),
              // CTA
              SizedBox(
                height: kBtnHeight,
                child: FilledButton(
                  onPressed: _loading ? null : _next,
                  style: FilledButton.styleFrom(
                    backgroundColor: kPrimary,
                    foregroundColor: Colors.white,
                    shape: const RoundedRectangleBorder(borderRadius: kRadiusFull),
                    textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  child: _loading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(_ctaLabel),
                ),
              ),
              if (!_isLastStep && _step > 0) ...[
                const SizedBox(height: s8),
                TextButton(
                  onPressed: () => setState(() => _step = 2),
                  child: const Text('Skip to plan selection',
                    style: TextStyle(fontSize: 13, color: kTextMuted)),
                ),
              ],
              const SizedBox(height: s24),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Info step widget ──────────────────────────────────────────────────────────

class _InfoStepWidget extends StatelessWidget {
  final _InfoStep step;
  const _InfoStepWidget({required this.step});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 60, height: 60,
          decoration: BoxDecoration(color: kPrimaryLight, borderRadius: kRadiusLg),
          child: Center(child: Text(step.emoji, style: const TextStyle(fontSize: 28))),
        ),
        const SizedBox(height: s24),
        Text(step.heading, style: const TextStyle(
          fontSize: 26, fontWeight: FontWeight.w800, color: kText, letterSpacing: -0.5, height: 1.2)),
        const SizedBox(height: s12),
        Text(step.sub, style: const TextStyle(fontSize: 15, color: kTextSub, height: 1.6)),
        if (step.features != null) ...[
          const SizedBox(height: s24),
          ...step.features!.map((f) => _FeatureTile(f: f)),
        ],
      ],
    );
  }
}

class _FeatureTile extends StatelessWidget {
  final _Feature f;
  const _FeatureTile({required this.f});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: s10),
      padding: const EdgeInsets.all(s16),
      decoration: BoxDecoration(
        color: kBgCard, border: Border.all(color: kBorder), borderRadius: kRadiusMd),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(f.icon, style: const TextStyle(fontSize: 20)),
        const SizedBox(width: s12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(f.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kText)),
          const SizedBox(height: 2),
          Text(f.desc, style: const TextStyle(fontSize: 13, color: kTextSub)),
        ])),
      ]),
    );
  }
}

// ── Plan selection widget ─────────────────────────────────────────────────────

class _PlanStepWidget extends StatelessWidget {
  final String selectedPlan;
  final ValueChanged<String> onSelect;
  final String? error;
  const _PlanStepWidget({required this.selectedPlan, required this.onSelect, this.error});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Choose your plan', style: TextStyle(
          fontSize: 26, fontWeight: FontWeight.w800, color: kText, letterSpacing: -0.5, height: 1.2)),
        const SizedBox(height: s12),
        const Text('Start with a free trial — no credit card required. Upgrade any time.',
          style: TextStyle(fontSize: 15, color: kTextSub, height: 1.6)),
        const SizedBox(height: s24),
        ..._plans.map((p) => _PlanCard(
          plan: p,
          selected: selectedPlan == p.id,
          onTap: () => onSelect(p.id),
        )),
        if (error != null) ...[
          const SizedBox(height: s12),
          Container(
            padding: const EdgeInsets.all(s12),
            decoration: BoxDecoration(
              color: kErrorLight, borderRadius: kRadiusMd,
              border: Border.all(color: const Color(0xFFFCA5A5)),
            ),
            child: Text(error!, style: const TextStyle(fontSize: 13, color: kError)),
          ),
        ],
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  final _Plan plan;
  final bool selected;
  final VoidCallback onTap;
  const _PlanCard({required this.plan, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: s10),
        padding: const EdgeInsets.all(s16),
        decoration: BoxDecoration(
          color: kBgCard,
          borderRadius: kRadiusLg,
          border: Border.all(
            color: selected ? kPrimary : kBorder,
            width: selected ? 2 : 1.5,
          ),
          boxShadow: selected ? [BoxShadow(color: kPrimary.withOpacity(0.12), blurRadius: 8, offset: const Offset(0, 2))] : null,
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(plan.emoji, style: const TextStyle(fontSize: 22)),
              const SizedBox(width: s12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(plan.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: kText)),
                const SizedBox(height: 4),
                Text(plan.desc, style: const TextStyle(fontSize: 13, color: kTextSub, height: 1.5)),
              ])),
              const SizedBox(width: s8),
              Container(
                width: 22, height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: selected ? kPrimary : Colors.transparent,
                  border: Border.all(color: selected ? kPrimary : kBorder, width: 2),
                ),
                child: selected
                    ? const Icon(Icons.check, size: 13, color: Colors.white)
                    : null,
              ),
            ]),
            if (plan.recommended)
              Positioned(
                top: -22, right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(color: kPrimary, borderRadius: kRadiusFull),
                  child: const Text('Recommended',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 0.5)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
