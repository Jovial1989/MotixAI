import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../l10n/generated/app_localizations.dart';
import '../../../shared/api/providers.dart';
import '../../../shared/models/models.dart';
import '../../../shared/providers/locale_provider.dart';
import '../../../shared/widgets/mx_widgets.dart';
import '../../auth/auth_provider.dart';
import '../../billing/presentation/stripe_checkout_screen.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _promoCtrl = TextEditingController();
  bool _promoLoading = false;
  bool _billingLoading = false;
  bool _billingSummaryLoading = false;
  String? _promoError;
  String? _billingError;
  bool _promoSuccess = false;
  BillingSummary? _billingSummary;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadBillingSummary();
    });
  }

  @override
  void dispose() {
    _promoCtrl.dispose();
    super.dispose();
  }

  String _friendlyBillingError(Object error, S l) {
    final msg = error.toString().replaceFirst('Exception: ', '').toLowerCase();
    if (msg.contains('connection refused') ||
        msg.contains('socketexception') ||
        msg.contains('failed host lookup')) {
      return l.billingConnectionIssue;
    }
    if (msg.contains('no billing account found')) {
      return l.billingProfileUnavailable;
    }
    return l.billingStartFailed;
  }

  Future<void> _loadBillingSummary() async {
    final auth = ref.read(authProvider);
    if (auth.tokens == null || auth.tokens!.user.role == 'GUEST') return;

    setState(() {
      _billingSummaryLoading = true;
      _billingError = null;
    });
    try {
      final summary = await ref.read(apiClientProvider).getBillingSummary();
      if (!mounted) return;
      setState(() => _billingSummary = summary);
    } catch (e) {
      if (!mounted) return;
      setState(() => _billingError = _friendlyBillingError(e, S.of(context)!));
    } finally {
      if (mounted) setState(() => _billingSummaryLoading = false);
    }
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

  Future<void> _startCheckout({required bool trial}) async {
    final l = S.of(context)!;
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() {
      _billingLoading = true;
      _billingError = null;
    });
    try {
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

      final result = await navigator.push<StripeCheckoutResult>(
        MaterialPageRoute(
          builder: (_) => StripeCheckoutScreen(
            checkoutUrl: Uri.parse(url),
            title: l.billingCheckoutTitle,
          ),
          fullscreenDialog: true,
        ),
      );

      if (!mounted) return;
      if (result == StripeCheckoutResult.cancelled) {
        messenger.showSnackBar(SnackBar(content: Text(l.billingCancelled)));
        return;
      }
      if (result != StripeCheckoutResult.success) {
        throw StateError('stripe_checkout_failed');
      }

      final updated = await _refreshPlanUntil((planType, subStatus) {
        if (trial) return planType == 'trial' && subStatus == 'active';
        return planType == 'premium' && subStatus == 'active';
      });
      if (!updated) {
        throw StateError('billing_state_not_updated');
      }

      await _loadBillingSummary();
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
            content: Text(
                trial ? l.billingTrialStarted : l.billingUpgradeSucceeded)),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _billingError = _friendlyBillingError(e, l));
      messenger
          .showSnackBar(SnackBar(content: Text(_friendlyBillingError(e, l))));
    } finally {
      if (mounted) setState(() => _billingLoading = false);
    }
  }

  Future<void> _openManageSubscription() async {
    final l = S.of(context)!;
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() {
      _billingLoading = true;
      _billingError = null;
    });
    try {
      final response = await ref.read(apiClientProvider).createPortalSession({
        'returnUrl': 'https://www.motixi.com/dashboard',
      });
      final url = response['url'] as String?;
      if (url == null || url.isEmpty) {
        throw StateError('missing_portal_url');
      }

      await navigator.push<StripeCheckoutResult>(
        MaterialPageRoute(
          builder: (_) => StripeCheckoutScreen(
            checkoutUrl: Uri.parse(url),
            title: l.manageSubscription,
          ),
          fullscreenDialog: true,
        ),
      );

      await ref.read(authProvider.notifier).refreshSession();
      await _loadBillingSummary();
    } catch (e) {
      if (!mounted) return;
      setState(() => _billingError = _friendlyBillingError(e, l));
      messenger
          .showSnackBar(SnackBar(content: Text(_friendlyBillingError(e, l))));
    } finally {
      if (mounted) setState(() => _billingLoading = false);
    }
  }

  Future<void> _contactBillingSupport() async {
    final l = S.of(context)!;
    final mail = Uri(
      scheme: 'mailto',
      path: 'hello@motixi.com',
      queryParameters: const {'subject': 'Motixi billing support'},
    );
    final web = Uri.parse('https://www.motixi.com/contacts');
    if (await canLaunchUrl(mail)) {
      await launchUrl(mail);
      return;
    }
    if (await canLaunchUrl(web)) {
      await launchUrl(web, mode: LaunchMode.externalApplication);
      return;
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(l.billingSupportUnavailable)),
    );
  }

  Future<void> _redeemPromo() async {
    final code = _promoCtrl.text.trim();
    if (code.isEmpty) return;
    setState(() {
      _promoLoading = true;
      _promoError = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.redeemPromo(code);
      final planType = res['planType'] as String? ?? 'premium';
      final subStatus = res['subscriptionStatus'] as String? ?? 'active';
      await ref.read(authProvider.notifier).updatePlan(planType, subStatus);
      await _loadBillingSummary();
      if (mounted) {
        setState(() {
          _promoSuccess = true;
          _promoCtrl.clear();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _promoError = e.toString().replaceFirst('Exception: ', '');
        });
      }
    } finally {
      if (mounted) setState(() => _promoLoading = false);
    }
  }

  String _formatDate(String? iso) {
    if (iso == null || iso.isEmpty) return '—';
    final parsed = DateTime.tryParse(iso);
    if (parsed == null) return '—';
    return DateFormat.yMMMMd(Localizations.localeOf(context).toLanguageTag())
        .format(parsed.toLocal());
  }

  String _priceText(int? amount, String currency) {
    final cents = amount ?? 3900;
    return NumberFormat.currency(
      symbol: '\$',
      decimalDigits: 0,
      name: currency,
    ).format(cents / 100);
  }

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    final auth = ref.watch(authProvider);
    final locale = ref.watch(localeProvider);
    final user = auth.tokens?.user;

    final planType = _billingSummary?.planType ?? user?.planType ?? 'free';
    final subStatus = _billingSummary?.subscriptionStatus ??
        user?.subscriptionStatus ??
        'none';
    final trialEndsAt = _billingSummary?.trialEndsAt ?? user?.trialEndsAt;
    final currentPeriodEnd = _billingSummary?.currentPeriodEnd;
    final isPremium = planType == 'premium';
    final isTrial = planType == 'trial' && subStatus == 'active';
    final trialDaysLeft = isTrial && trialEndsAt != null
        ? DateTime.parse(trialEndsAt)
            .difference(DateTime.now())
            .inDays
            .clamp(0, 999)
        : null;
    final priceText = _priceText(
      _billingSummary?.priceAmount,
      _billingSummary?.priceCurrency ?? 'USD',
    );
    final cadenceText = '$priceText/${l.perMonthShort}';

    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: s16, vertical: s12),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: kBorder)),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: const Icon(Icons.arrow_back_ios,
                        size: 20, color: kPrimary),
                  ),
                  const SizedBox(width: s12),
                  Text(l.profile, style: tsSubhead),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(s16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
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
                            width: 60,
                            height: 60,
                            decoration: const BoxDecoration(
                                color: kPrimary, shape: BoxShape.circle),
                            child: Center(
                              child: Text(
                                user?.email.isNotEmpty == true
                                    ? user!.email[0].toUpperCase()
                                    : 'U',
                                style: const TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: s16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user?.email ?? '—',
                                  style: tsSubhead,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: s4),
                                Row(
                                  children: [
                                    if (user?.role != null) ...[
                                      MxChip(
                                        user!.role,
                                        bg: kPrimaryLight,
                                        border: kPrimaryBorder,
                                        textColor: kPrimaryDark,
                                      ),
                                      const SizedBox(width: s8),
                                    ],
                                    _PlanChip(planType: planType),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: s16),
                    MxSectionHeader(l.accountSection),
                    _TileCard(children: [
                      _InfoRow(label: l.emailLabel, value: user?.email ?? '—'),
                    ]),
                    const SizedBox(height: s16),
                    MxSectionHeader(l.languageSection),
                    _TileCard(children: [
                      _InfoRow(
                          label: l.currentLanguageLabel,
                          value: _languageName(locale.languageCode, l)),
                      const _Divider(),
                      Padding(
                        padding: const EdgeInsets.all(s16),
                        child: Wrap(
                          spacing: s10,
                          runSpacing: s10,
                          children: [
                            _LanguageChoice(
                              label: l.languageEnglish,
                              selected: locale.languageCode == 'en',
                              onTap: () => ref
                                  .read(localeProvider.notifier)
                                  .setLocale('en'),
                            ),
                            _LanguageChoice(
                              label: l.languageUkrainian,
                              selected: locale.languageCode == 'uk',
                              onTap: () => ref
                                  .read(localeProvider.notifier)
                                  .setLocale('uk'),
                            ),
                            _LanguageChoice(
                              label: l.languageBulgarian,
                              selected: locale.languageCode == 'bg',
                              onTap: () => ref
                                  .read(localeProvider.notifier)
                                  .setLocale('bg'),
                            ),
                          ],
                        ),
                      ),
                    ]),
                    const SizedBox(height: s16),
                    MxSectionHeader(l.planSection),
                    _TileCard(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(s16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (_billingSummaryLoading)
                                const LinearProgressIndicator(
                                  minHeight: 2,
                                  color: kPrimary,
                                  backgroundColor: Color(0xFFFFEDD5),
                                ),
                              if (_billingSummaryLoading)
                                const SizedBox(height: s12),
                              if (isPremium) ...[
                                _ProBanner(),
                                const SizedBox(height: s16),
                                _PlanDetailRow(
                                    label: l.planLabel, value: l.proPlanTitle),
                                _PlanDetailRow(
                                    label: l.priceLabel, value: cadenceText),
                                _PlanDetailRow(
                                  label: l.nextBillingDateLabel,
                                  value: _formatDate(currentPeriodEnd),
                                ),
                                _PlanDetailRow(
                                  label: l.paymentMethodLabel,
                                  value: _billingSummary?.paymentMethodLast4 !=
                                          null
                                      ? '${_billingSummary?.paymentMethodBrand ?? l.cardLabel} •••• ${_billingSummary!.paymentMethodLast4}'
                                      : l.noPaymentMethodAdded,
                                ),
                                const SizedBox(height: s14),
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton(
                                    onPressed: _billingLoading
                                        ? null
                                        : (_billingSummary
                                                    ?.canManageSubscription ??
                                                false)
                                            ? _openManageSubscription
                                            : _contactBillingSupport,
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: kPrimary,
                                      side: const BorderSide(
                                          color: kPrimaryBorder),
                                      minimumSize: const Size.fromHeight(48),
                                      shape: RoundedRectangleBorder(
                                          borderRadius: kRadiusMd),
                                    ),
                                    child: Text(
                                      (_billingSummary?.canManageSubscription ??
                                              false)
                                          ? l.manageSubscription
                                          : l.contactBillingSupport,
                                    ),
                                  ),
                                ),
                              ] else if (isTrial) ...[
                                _TrialBanner(daysLeft: trialDaysLeft ?? 0),
                                const SizedBox(height: s16),
                                _PlanDetailRow(
                                    label: l.planLabel, value: l.proTrialPlan),
                                _PlanDetailRow(
                                    label: l.priceAfterTrialLabel,
                                    value: cadenceText),
                                _PlanDetailRow(
                                  label: l.trialDaysLeftLabel,
                                  value: trialDaysLeft?.toString() ?? '—',
                                ),
                                _PlanDetailRow(
                                  label: l.renewsOnLabel,
                                  value: _formatDate(trialEndsAt),
                                ),
                                const SizedBox(height: s14),
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton(
                                    onPressed: _billingLoading
                                        ? null
                                        : (_billingSummary
                                                    ?.canManageSubscription ??
                                                false)
                                            ? _openManageSubscription
                                            : _contactBillingSupport,
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: kPrimary,
                                      side: const BorderSide(
                                          color: kPrimaryBorder),
                                      minimumSize: const Size.fromHeight(48),
                                      shape: RoundedRectangleBorder(
                                          borderRadius: kRadiusMd),
                                    ),
                                    child: Text(
                                      (_billingSummary?.canManageSubscription ??
                                              false)
                                          ? l.manageSubscription
                                          : l.contactBillingSupport,
                                    ),
                                  ),
                                ),
                              ] else ...[
                                _FreeBanner(),
                                const SizedBox(height: s16),
                                _PlanDetailRow(
                                    label: l.planLabel, value: l.freePlan),
                                _PlanDetailRow(
                                    label: l.includesLabel,
                                    value: l.freePlanIncludes),
                                const SizedBox(height: s10),
                                SizedBox(
                                  width: double.infinity,
                                  child: FilledButton.icon(
                                    onPressed: _billingLoading
                                        ? null
                                        : () => _startCheckout(trial: true),
                                    icon: _billingLoading
                                        ? const SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(
                                              color: Colors.white,
                                              strokeWidth: 2,
                                            ),
                                          )
                                        : const Icon(Icons.bolt, size: 18),
                                    label: Text(l.startFreeTrial),
                                    style: FilledButton.styleFrom(
                                      backgroundColor: kPrimary,
                                      shape: RoundedRectangleBorder(
                                          borderRadius: kRadiusMd),
                                      minimumSize: const Size.fromHeight(48),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: s10),
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton(
                                    onPressed: _billingLoading
                                        ? null
                                        : () => _startCheckout(trial: false),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: kPrimary,
                                      side: const BorderSide(
                                          color: kPrimaryBorder),
                                      shape: RoundedRectangleBorder(
                                          borderRadius: kRadiusMd),
                                      minimumSize: const Size.fromHeight(48),
                                    ),
                                    child: Text(l.upgradeToPro),
                                  ),
                                ),
                                const SizedBox(height: s10),
                                Text(
                                  l.trialBillingNote,
                                  style: const TextStyle(
                                      fontSize: 13,
                                      color: kTextSub,
                                      height: 1.5),
                                ),
                                const SizedBox(height: s12),
                                _PromoSection(
                                  ctrl: _promoCtrl,
                                  loading: _promoLoading,
                                  error: _promoError,
                                  success: _promoSuccess,
                                  onRedeem: _redeemPromo,
                                ),
                              ],
                              if (_billingError != null) ...[
                                const SizedBox(height: s12),
                                Text(
                                  _billingError!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFFDC2626),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: s16),
                    _TileCard(children: [
                      _NavRow(
                        icon: Icons.history,
                        label: l.guideHistory,
                        onTap: () => context.push('/history'),
                      ),
                    ]),
                    const SizedBox(height: s32),
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
                          shape:
                              RoundedRectangleBorder(borderRadius: kRadiusMd),
                        ),
                        child: Text(
                          l.signOut,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
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

  String _languageName(String code, S l) {
    switch (code) {
      case 'uk':
        return l.languageUkrainian;
      case 'bg':
        return l.languageBulgarian;
      default:
        return l.languageEnglish;
    }
  }
}

class _PlanChip extends StatelessWidget {
  final String planType;
  const _PlanChip({required this.planType});

  @override
  Widget build(BuildContext context) {
    final (label, bg, border, textColor) = switch (planType) {
      'premium' => (
          'Pro',
          const Color(0xFFFFF7ED),
          const Color(0xFFFDBA74),
          kPrimary
        ),
      'trial' => (
          'Trial',
          const Color(0xFFE0F2FE),
          const Color(0xFFBAE6FD),
          const Color(0xFF0369A1)
        ),
      _ => ('Free', const Color(0xFFF8FAFC), kBorder, kTextMuted),
    };
    return MxChip(label, bg: bg, border: border, textColor: textColor);
  }
}

class _LanguageChoice extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _LanguageChoice({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: selected ? kPrimaryBorder : kBorder),
      ),
      backgroundColor: Colors.white,
      selectedColor: const Color(0xFFFFF7ED),
      labelStyle: TextStyle(
        color: selected ? kPrimary : kText,
        fontWeight: FontWeight.w700,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    );
  }
}

class _ProBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    return Container(
      padding: const EdgeInsets.all(s16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: kRadiusLg,
        border: Border.all(color: const Color(0xFFFDBA74)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l.proActive,
            style: const TextStyle(
                fontSize: 14, fontWeight: FontWeight.w700, color: kPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            l.proActiveDesc,
            style:
                const TextStyle(fontSize: 12, color: kTextMuted, height: 1.5),
          ),
        ],
      ),
    );
  }
}

class _TrialBanner extends StatelessWidget {
  final int daysLeft;
  const _TrialBanner({required this.daysLeft});

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    return Container(
      padding: const EdgeInsets.all(s16),
      decoration: BoxDecoration(
        color: const Color(0xFFE0F2FE),
        borderRadius: kRadiusLg,
        border: Border.all(color: const Color(0xFFBAE6FD)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l.trialActive,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0369A1),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            l.trialDaysRemaining(daysLeft),
            style: const TextStyle(fontSize: 12, color: Color(0xFF0369A1)),
          ),
          const SizedBox(height: 4),
          Text(
            l.trialRenewsAfter,
            style: const TextStyle(
                fontSize: 12, color: Color(0xFF0369A1), height: 1.4),
          ),
        ],
      ),
    );
  }
}

class _FreeBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    return Container(
      padding: const EdgeInsets.all(s16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: kRadiusLg,
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l.freePlan,
            style: const TextStyle(
                fontSize: 14, fontWeight: FontWeight.w700, color: kText),
          ),
          const SizedBox(height: 4),
          Text(
            l.freePlanDesc,
            style:
                const TextStyle(fontSize: 12, color: kTextMuted, height: 1.5),
          ),
        ],
      ),
    );
  }
}

class _PlanDetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _PlanDetailRow({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: s10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, color: kTextSub),
            ),
          ),
          const SizedBox(width: s12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontSize: 13,
                color: kText,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PromoSection extends StatelessWidget {
  final TextEditingController ctrl;
  final bool loading;
  final String? error;
  final bool success;
  final VoidCallback onRedeem;

  const _PromoSection({
    required this.ctrl,
    required this.loading,
    required this.error,
    required this.success,
    required this.onRedeem,
  });

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    return Container(
      padding: const EdgeInsets.all(s16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: kRadiusLg,
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l.promoCode,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: kTextMuted,
            ),
          ),
          const SizedBox(height: s8),
          if (success) ...[
            Container(
              padding: const EdgeInsets.all(s12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: kRadiusMd,
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle,
                      size: 16, color: Color(0xFF16A34A)),
                  const SizedBox(width: s8),
                  Text(
                    l.promoApplied,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF16A34A),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: ctrl,
                    textCapitalization: TextCapitalization.none,
                    decoration: InputDecoration(
                      hintText: l.enterPromoCode,
                      hintStyle:
                          const TextStyle(color: kTextMuted, fontSize: 14),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: kBorder),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: kBorder),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide:
                            const BorderSide(color: kPrimary, width: 1.5),
                      ),
                    ),
                    onSubmitted: (_) => onRedeem(),
                  ),
                ),
                const SizedBox(width: s8),
                SizedBox(
                  height: 44,
                  child: FilledButton(
                    onPressed: loading ? null : onRedeem,
                    style: FilledButton.styleFrom(
                      backgroundColor: kPrimary,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(22)),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    child: loading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            l.apply,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                  ),
                ),
              ],
            ),
            if (error != null) ...[
              const SizedBox(height: s8),
              Text(
                error!,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFFDC2626),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

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
            Text(
              label,
              style: tsCaption.copyWith(
                  color: kTextMuted, fontWeight: FontWeight.w600),
            ),
            const Spacer(),
            Flexible(
              child: Text(
                value,
                textAlign: TextAlign.right,
                style: tsCaption.copyWith(color: kText),
                overflow: TextOverflow.ellipsis,
              ),
            ),
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
  const _Divider();

  @override
  Widget build(BuildContext context) =>
      Divider(height: 1, color: kBorder, indent: s16, endIndent: s16);
}
