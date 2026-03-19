import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/auth_provider.dart';
import '../../../shared/api/providers.dart';
import '../../../shared/widgets/mx_widgets.dart';
import '../../../app/theme.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _promoCtrl = TextEditingController();
  bool _promoLoading = false;
  String? _promoError;
  bool _promoSuccess = false;

  @override
  void dispose() {
    _promoCtrl.dispose();
    super.dispose();
  }

  Future<void> _redeemPromo() async {
    final code = _promoCtrl.text.trim();
    if (code.isEmpty) return;
    setState(() { _promoLoading = true; _promoError = null; });
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.redeemPromo(code);
      final planType = res['planType'] as String? ?? 'premium';
      final subStatus = res['subscriptionStatus'] as String? ?? 'active';
      await ref.read(authProvider.notifier).updatePlan(planType, subStatus);
      if (mounted) setState(() { _promoSuccess = true; _promoCtrl.clear(); });
    } catch (e) {
      if (mounted) setState(() { _promoError = e.toString().replaceFirst('Exception: ', ''); });
    } finally {
      if (mounted) setState(() => _promoLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final user = auth.tokens?.user;
    final planType = user?.planType ?? 'free';
    final subStatus = user?.subscriptionStatus ?? 'none';
    final trialEndsAt = user?.trialEndsAt;

    final isPremium = planType == 'premium';
    final isTrial = planType == 'trial' && subStatus == 'active';

    int? trialDaysLeft;
    if (isTrial && trialEndsAt != null) {
      final end = DateTime.tryParse(trialEndsAt);
      if (end != null) trialDaysLeft = end.difference(DateTime.now()).inDays.clamp(0, 999);
    }

    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: s16, vertical: s12),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: kBorder)),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Icon(Icons.arrow_back_ios, size: 20, color: kPrimary),
                  ),
                  const SizedBox(width: s12),
                  Text('Profile', style: tsSubhead),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(s16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Avatar card
                    Container(
                      padding: const EdgeInsets.all(s16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: kRadiusLg,
                        border: Border.all(color: kBorder),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 60, height: 60,
                            decoration: const BoxDecoration(color: kPrimary, shape: BoxShape.circle),
                            child: Center(child: Text(
                              user?.email.isNotEmpty == true ? user!.email[0].toUpperCase() : 'U',
                              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white),
                            )),
                          ),
                          const SizedBox(width: s16),
                          Expanded(child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(user?.email ?? '—', style: tsSubhead, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: s4),
                              Row(children: [
                                MxChip(user?.role ?? 'USER', bg: kPrimaryLight, border: kPrimaryBorder, textColor: kPrimaryDark),
                                const SizedBox(width: s8),
                                _PlanChip(planType: planType),
                              ]),
                            ],
                          )),
                        ],
                      ),
                    ),
                    const SizedBox(height: s16),

                    // Account section
                    MxSectionHeader('Account'),
                    _TileCard(children: [
                      _InfoRow(label: 'Email', value: user?.email ?? '—'),
                      _Divider(),
                      _InfoRow(label: 'Role', value: user?.role ?? '—'),
                      if (user?.tenantId != null) ...[
                        _Divider(),
                        _InfoRow(label: 'Tenant', value: user!.tenantId!),
                      ],
                    ]),
                    const SizedBox(height: s16),

                    // Plan section
                    MxSectionHeader('Plan & Billing'),
                    if (isPremium) ...[
                      _ProBanner(),
                    ] else if (isTrial) ...[
                      _TrialBanner(daysLeft: trialDaysLeft ?? 0),
                      const SizedBox(height: s12),
                      _PromoSection(
                        ctrl: _promoCtrl,
                        loading: _promoLoading,
                        error: _promoError,
                        success: _promoSuccess,
                        onRedeem: _redeemPromo,
                      ),
                    ] else ...[
                      _FreeBanner(),
                      const SizedBox(height: s12),
                      _PromoSection(
                        ctrl: _promoCtrl,
                        loading: _promoLoading,
                        error: _promoError,
                        success: _promoSuccess,
                        onRedeem: _redeemPromo,
                      ),
                    ],
                    const SizedBox(height: s16),

                    // Navigation
                    MxSectionHeader('Navigation'),
                    _TileCard(children: [
                      _NavRow(
                        icon: Icons.history,
                        label: 'Guide History',
                        onTap: () => context.push('/history'),
                      ),
                    ]),
                    const SizedBox(height: s32),

                    // Sign out
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () async {
                          await ref.read(authProvider.notifier).logout();
                          if (context.mounted) context.go('/login');
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFDC2626),
                          side: const BorderSide(color: Color(0xFFFCA5A5)),
                          minimumSize: const Size.fromHeight(52),
                          shape: RoundedRectangleBorder(borderRadius: kRadiusMd),
                        ),
                        child: const Text('Sign out', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Plan chip ─────────────────────────────────────────────────────────────────

class _PlanChip extends StatelessWidget {
  final String planType;
  const _PlanChip({required this.planType});

  @override
  Widget build(BuildContext context) {
    final (label, bg, border, textColor) = switch (planType) {
      'premium' => ('Pro', const Color(0xFFFFF7ED), const Color(0xFFFDBA74), kPrimary),
      'trial'   => ('Trial', const Color(0xFFE0F2FE), const Color(0xFFBAE6FD), const Color(0xFF0369A1)),
      _         => ('Free', const Color(0xFFF8FAFC), kBorder, kTextMuted),
    };
    return MxChip(label, bg: bg, border: border, textColor: textColor);
  }
}

// ── Plan banners ─────────────────────────────────────────────────────────────

class _ProBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(s16),
    decoration: BoxDecoration(
      color: const Color(0xFFFFF7ED),
      borderRadius: kRadiusLg,
      border: Border.all(color: const Color(0xFFFDBA74)),
    ),
    child: Row(children: [
      const Text('⚡', style: TextStyle(fontSize: 22)),
      const SizedBox(width: s12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Pro plan active', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kPrimary)),
        const SizedBox(height: 2),
        Text('Unlimited guides · Priority images · API access',
          style: TextStyle(fontSize: 12, color: kTextMuted)),
      ])),
    ]),
  );
}

class _TrialBanner extends StatelessWidget {
  final int daysLeft;
  const _TrialBanner({required this.daysLeft});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(s16),
    decoration: BoxDecoration(
      color: const Color(0xFFE0F2FE),
      borderRadius: kRadiusLg,
      border: Border.all(color: const Color(0xFFBAE6FD)),
    ),
    child: Row(children: [
      const Icon(Icons.access_time, size: 20, color: Color(0xFF0369A1)),
      const SizedBox(width: s12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Trial active', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0369A1))),
        const SizedBox(height: 2),
        Text('$daysLeft day${daysLeft != 1 ? 's' : ''} remaining',
          style: const TextStyle(fontSize: 12, color: Color(0xFF0369A1))),
      ])),
    ]),
  );
}

class _FreeBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(s16),
    decoration: BoxDecoration(
      color: const Color(0xFFF8FAFC),
      borderRadius: kRadiusLg,
      border: Border.all(color: kBorder),
    ),
    child: Row(children: [
      const Icon(Icons.star_outline, size: 20, color: kTextMuted),
      const SizedBox(width: s12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Free plan', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kText)),
        const SizedBox(height: 2),
        Text('5 guides/month. Use a promo code to unlock Pro.',
          style: TextStyle(fontSize: 12, color: kTextMuted)),
      ])),
    ]),
  );
}

// ── Promo section ─────────────────────────────────────────────────────────────

class _PromoSection extends StatelessWidget {
  final TextEditingController ctrl;
  final bool loading;
  final String? error;
  final bool success;
  final VoidCallback onRedeem;
  const _PromoSection({
    required this.ctrl, required this.loading, required this.error,
    required this.success, required this.onRedeem,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(s16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: kRadiusLg,
      border: Border.all(color: kBorder),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('PROMO CODE', style: TextStyle(
        fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.6, color: kTextMuted,
      )),
      const SizedBox(height: s8),
      if (success) ...[
        Container(
          padding: const EdgeInsets.all(s12),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FDF4),
            borderRadius: kRadiusMd,
            border: Border.all(color: const Color(0xFFBBF7D0)),
          ),
          child: const Row(children: [
            Icon(Icons.check_circle, size: 16, color: Color(0xFF16A34A)),
            SizedBox(width: s8),
            Text('Promo applied! You now have Pro access.', style: TextStyle(
              fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF16A34A),
            )),
          ]),
        ),
      ] else ...[
        Row(children: [
          Expanded(child: TextField(
            controller: ctrl,
            textCapitalization: TextCapitalization.none,
            decoration: InputDecoration(
              hintText: 'Enter promo code…',
              hintStyle: const TextStyle(color: kTextMuted, fontSize: 14),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: kBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: kBorder)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kPrimary, width: 1.5)),
            ),
            onSubmitted: (_) => onRedeem(),
          )),
          const SizedBox(width: s8),
          SizedBox(
            height: 44,
            child: FilledButton(
              onPressed: loading ? null : onRedeem,
              style: FilledButton.styleFrom(
                backgroundColor: kPrimary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
                padding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              child: loading
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Apply', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ]),
        if (error != null) ...[
          const SizedBox(height: s8),
          Text(error!, style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626), fontWeight: FontWeight.w500)),
        ],
      ],
    ]),
  );
}

// ── Small helper widgets ──────────────────────────────────────────────────────

class _TileCard extends StatelessWidget {
  final List<Widget> children;
  const _TileCard({required this.children});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: kRadiusLg,
      border: Border.all(color: kBorder),
    ),
    child: Column(children: children),
  );
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: s16, vertical: s12),
    child: Row(
      children: [
        Text(label, style: tsCaption.copyWith(color: kTextMuted, fontWeight: FontWeight.w600)),
        const Spacer(),
        Text(value, style: tsCaption.copyWith(color: kText), overflow: TextOverflow.ellipsis),
      ],
    ),
  );
}

class _NavRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _NavRow({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: kRadiusLg,
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: s16, vertical: s14),
      child: Row(
        children: [
          Icon(icon, size: 18, color: kPrimary),
          const SizedBox(width: s12),
          Expanded(child: Text(label, style: tsSmallBold)),
          const Icon(Icons.chevron_right, size: 18, color: kTextMuted),
        ],
      ),
    ),
  );
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
      Divider(height: 1, color: kBorder, indent: s16, endIndent: s16);
}
