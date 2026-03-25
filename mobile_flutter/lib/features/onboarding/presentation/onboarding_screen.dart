import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../shared/api/providers.dart';
import '../../auth/auth_provider.dart';
import '../../billing/presentation/stripe_checkout_screen.dart';
import '../../../l10n/generated/app_localizations.dart';

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

List<_InfoStep> _buildInfoSteps(S l) => [
      _InfoStep(
        '🔧',
        l.onboardingWelcome,
        l.onboardingWelcomeSub,
      ),
      _InfoStep(
        '⚡',
        l.onboardingFeatures,
        l.onboardingFeaturesSub,
        [
          _Feature('📋', l.featStepByStep, l.featStepByStepDesc),
          _Feature('🖼️', l.featAiIllustrations, l.featAiIllustrationsDesc),
          _Feature('💬', l.featAskGuide, l.featAskGuideDesc),
        ],
      ),
    ];

class _Plan {
  final String id;
  final String emoji;
  final String name;
  final String desc;
  final bool recommended;
  const _Plan(this.id, this.emoji, this.name, this.desc,
      {this.recommended = false});
}

List<_Plan> _buildPlans(S l) => [
      _Plan('trial', '🚀', l.planTrial, l.planTrialDesc, recommended: true),
      _Plan('free', '🔓', l.planFree, l.planFreeDesc),
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

  String _friendlyBillingError(Object error, S l) {
    final msg = error.toString().replaceFirst('Exception: ', '').toLowerCase();
    if (msg.contains('connection refused') ||
        msg.contains('socketexception') ||
        msg.contains('failed host lookup')) {
      return l.billingConnectionIssue;
    }
    return l.billingStartFailed;
  }

  Future<bool> _refreshPlanUntil(
      bool Function(String planType, String subStatus) matches) async {
    final auth = ref.read(authProvider.notifier);
    for (var i = 0; i < 6; i++) {
      final tokens = await auth.refreshSession();
      if (tokens != null &&
          matches(tokens.user.planType, tokens.user.subscriptionStatus)) {
        return true;
      }
      await Future<void>.delayed(const Duration(seconds: 1));
    }
    return false;
  }

  Future<StripeCheckoutResult?> _launchStripeCheckout(
      {required bool trial}) async {
    final api = ref.read(apiClientProvider);
    final response = await api.createCheckoutSession({
      'trial': trial,
      'successUrl':
          'https://www.motixi.com/dashboard?billing=${trial ? 'trial-started' : 'success'}',
      'cancelUrl': 'https://www.motixi.com/dashboard?billing=cancelled',
    });
    final url = response['url'] as String?;
    if (url == null || url.isEmpty) {
      throw StateError('missing_checkout_url');
    }
    if (!mounted) return null;
    return Navigator.of(context).push<StripeCheckoutResult>(
      MaterialPageRoute(
        builder: (_) => StripeCheckoutScreen(checkoutUrl: Uri.parse(url)),
        fullscreenDialog: true,
      ),
    );
  }

  Future<void> _finish() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final l = S.of(context)!;
      final api = ref.read(apiClientProvider);
      if (_selectedPlan == 'free') {
        await api.selectPlan('free');
        await api.completeOnboarding();
        await ref.read(tokenStoreProvider).saveOnboardingDone(true);
        ref.read(authProvider.notifier).markOnboardingComplete();
        if (mounted) context.go('/dashboard');
        return;
      }

      final checkoutResult = await _launchStripeCheckout(trial: true);
      if (checkoutResult == StripeCheckoutResult.cancelled) {
        setState(() {
          _loading = false;
          _error = l.billingCancelled;
        });
        return;
      }
      if (checkoutResult != StripeCheckoutResult.success) {
        throw StateError('stripe_checkout_failed');
      }

      final updated = await _refreshPlanUntil((planType, subStatus) =>
          planType == 'trial' && subStatus == 'active');
      if (!updated) {
        throw StateError('trial_not_activated');
      }

      await api.completeOnboarding();
      await ref.read(tokenStoreProvider).saveOnboardingDone(true);
      ref.read(authProvider.notifier).markOnboardingComplete();
      if (mounted) context.go('/dashboard');
    } catch (e) {
      setState(() {
        _loading = false;
        _error = _friendlyBillingError(e, S.of(context)!);
      });
      return;
    }
    if (mounted) {
      setState(() => _loading = false);
    }
  }

  void _next() {
    if (_isLastStep) {
      _finish();
    } else {
      setState(() => _step++);
    }
  }

  String _ctaLabel(S l) {
    if (_isLastStep) {
      if (_selectedPlan == 'trial') return l.startFreeTrial;
      return l.continueFree;
    }
    return l.continueBtn;
  }

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    final infoSteps = _buildInfoSteps(l);
    final plans = _buildPlans(l);

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
                  width: 32,
                  height: 32,
                  decoration:
                      BoxDecoration(color: kPrimary, borderRadius: kRadiusSm),
                  child: const Center(
                    child: Text('M',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Colors.white)),
                  ),
                ),
                const SizedBox(width: 10),
                const Text('Motixi',
                    style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: kText,
                        letterSpacing: -0.4)),
              ]),
              const SizedBox(height: s32),
              // Step dots
              Row(children: [
                for (int i = 0; i < _totalSteps; i++) ...[
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    width: i == _step ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: i < _step
                          ? kPrimaryDark
                          : i == _step
                              ? kPrimary
                              : kBorder,
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
                  child: _step < 2
                      ? _InfoStepWidget(step: infoSteps[_step])
                      : _PlanStepWidget(
                          plans: plans,
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
                    shape:
                        const RoundedRectangleBorder(borderRadius: kRadiusFull),
                    textStyle: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : Text(_ctaLabel(l)),
                ),
              ),
              if (!_isLastStep && _step > 0) ...[
                const SizedBox(height: s8),
                TextButton(
                  onPressed: () => setState(() => _step = 2),
                  child: Text(l.skipToPlan,
                      style: const TextStyle(fontSize: 13, color: kTextMuted)),
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
          width: 60,
          height: 60,
          decoration:
              BoxDecoration(color: kPrimaryLight, borderRadius: kRadiusLg),
          child: Center(
              child: Text(step.emoji, style: const TextStyle(fontSize: 28))),
        ),
        const SizedBox(height: s24),
        Text(step.heading,
            style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: kText,
                letterSpacing: -0.5,
                height: 1.2)),
        const SizedBox(height: s12),
        Text(step.sub,
            style: const TextStyle(fontSize: 15, color: kTextSub, height: 1.6)),
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
          color: kBgCard,
          border: Border.all(color: kBorder),
          borderRadius: kRadiusMd),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(f.icon, style: const TextStyle(fontSize: 20)),
        const SizedBox(width: s12),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(f.title,
              style: const TextStyle(
                  fontSize: 14, fontWeight: FontWeight.w700, color: kText)),
          const SizedBox(height: 2),
          Text(f.desc, style: const TextStyle(fontSize: 13, color: kTextSub)),
        ])),
      ]),
    );
  }
}

// ── Plan selection widget ─────────────────────────────────────────────────────

class _PlanStepWidget extends StatelessWidget {
  final List<_Plan> plans;
  final String selectedPlan;
  final ValueChanged<String> onSelect;
  final String? error;
  const _PlanStepWidget(
      {required this.plans,
      required this.selectedPlan,
      required this.onSelect,
      this.error});

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l.choosePlan,
            style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: kText,
                letterSpacing: -0.5,
                height: 1.2)),
        const SizedBox(height: s12),
        Text(l.choosePlanSub,
            style: const TextStyle(fontSize: 15, color: kTextSub, height: 1.6)),
        const SizedBox(height: s24),
        ...plans.map((p) => _PlanCard(
              plan: p,
              selected: selectedPlan == p.id,
              onTap: () => onSelect(p.id),
            )),
        if (selectedPlan == 'trial') ...[
          const SizedBox(height: s4),
          Container(
            padding: const EdgeInsets.all(s12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: kRadiusMd,
              border: Border.all(color: const Color(0xFFFDBA74)),
            ),
            child: Text(
              l.trialBillingNote,
              style: const TextStyle(
                  fontSize: 13, color: kPrimaryDark, height: 1.45),
            ),
          ),
        ],
        if (error != null) ...[
          const SizedBox(height: s12),
          Container(
            padding: const EdgeInsets.all(s12),
            decoration: BoxDecoration(
              color: kErrorLight,
              borderRadius: kRadiusMd,
              border: Border.all(color: const Color(0xFFFCA5A5)),
            ),
            child: Text(error!,
                style: const TextStyle(fontSize: 13, color: kError)),
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
  const _PlanCard(
      {required this.plan, required this.selected, required this.onTap});

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
          boxShadow: selected
              ? [
                  BoxShadow(
                      color: kPrimary.withValues(alpha: 0.12),
                      blurRadius: 8,
                      offset: const Offset(0, 2))
                ]
              : null,
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(plan.emoji, style: const TextStyle(fontSize: 22)),
              const SizedBox(width: s12),
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(plan.name,
                        style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: kText)),
                    const SizedBox(height: 4),
                    Text(plan.desc,
                        style: const TextStyle(
                            fontSize: 13, color: kTextSub, height: 1.5)),
                  ])),
              const SizedBox(width: s8),
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: selected ? kPrimary : Colors.transparent,
                  border: Border.all(
                      color: selected ? kPrimary : kBorder, width: 2),
                ),
                child: selected
                    ? const Icon(Icons.check, size: 13, color: Colors.white)
                    : null,
              ),
            ]),
            if (plan.recommended)
              Positioned(
                top: -22,
                right: 0,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration:
                      BoxDecoration(color: kPrimary, borderRadius: kRadiusFull),
                  child: Text(S.of(context)!.planTrialBadge,
                      style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 0.5)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
