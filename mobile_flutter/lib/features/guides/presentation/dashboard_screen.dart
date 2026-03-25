import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../l10n/generated/app_localizations.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/mx_widgets.dart';
import '../../auth/auth_provider.dart';
import '../guides_provider.dart';
import 'guide_create_sheet.dart';
import 'guide_visuals.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  bool _creating = false;
  String? _lastLoadKey;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _loadGuidesIfNeeded();
  }

  String _languageCode() => Localizations.localeOf(context).languageCode;

  bool get _isGuest => ref.read(authProvider).tokens?.user.role == 'GUEST';

  Future<void> _reloadGuides() {
    return ref.read(guidesProvider.notifier).load(
          isGuest: _isGuest,
          language: _languageCode(),
        );
  }

  void _loadGuidesIfNeeded() {
    final key = '$_isGuest:${_languageCode()}';
    if (_lastLoadKey == key) return;
    _lastLoadKey = key;
    Future.microtask(_reloadGuides);
  }

  Future<void> _openCreateSheet() async {
    final isGuest = _isGuest;
    if (isGuest) {
      _showGuestAuthSheet();
      return;
    }
    final data = await showGuideCreateSheet(context);
    if (data == null || !mounted) return;
    setState(() => _creating = true);
    final guide = await ref.read(guidesProvider.notifier).create(
          data.vehicleModel,
          data.partName,
          oemNumber: data.oemNumber,
          language: _languageCode(),
        );
    setState(() => _creating = false);
    if (!mounted) return;
    if (guide != null) context.push('/guides/${guide.id}');
  }

  void _showGuestAuthSheet() {
    final l = S.of(context)!;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(26),
                border: Border.all(color: const Color(0xFFFDBA74)),
              ),
              child: const Center(
                child: Icon(Icons.auto_awesome_outlined,
                    color: kPrimary, size: 24),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              l.guestUpgradeTitle,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              l.guestUpgradeDesc,
              style:
                  TextStyle(fontSize: 13, color: Colors.grey[600], height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () {
                  Navigator.pop(context);
                  context.go('/signup');
                },
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFEA580C),
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  l.createAccount,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  Navigator.pop(context);
                  context.go('/login');
                },
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                child: Text(
                  l.signIn,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    final state = ref.watch(guidesProvider);
    final authState = ref.watch(authProvider);
    final isGuest = authState.tokens?.user.role == 'GUEST';

    return Scaffold(
      backgroundColor: kBg,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _creating ? null : _openCreateSheet,
        backgroundColor: isGuest ? const Color(0xFF64748B) : kPrimary,
        foregroundColor: Colors.white,
        icon: _creating
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2),
              )
            : Icon(isGuest ? Icons.lock_outline : Icons.add),
        label: Text(
          _creating
              ? l.generating
              : (isGuest ? l.signUpToGenerate : l.newGuide),
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            _TopBar(
              email: authState.tokens?.user.email ?? '',
              onProfile: isGuest ? null : () => context.push('/profile'),
            ),
            if (isGuest)
              Container(
                margin: const EdgeInsets.fromLTRB(s16, s8, s16, 0),
                padding:
                    const EdgeInsets.symmetric(horizontal: s12, vertical: s10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline,
                        size: 15, color: Color(0xFFD97706)),
                    const SizedBox(width: s8),
                    Expanded(
                      child: Text(
                        l.guestBanner,
                        style: const TextStyle(
                            fontSize: 12, color: Color(0xFF92400E)),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => context.go('/signup'),
                      child: Text(
                        l.guestBannerSignUp,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFEA580C),
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            if (isGuest)
              Padding(
                padding: const EdgeInsets.fromLTRB(s16, s16, s16, s8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l.sampleGuidesTitle, style: tsTitle),
                    const SizedBox(height: s8),
                    Text(l.sampleGuidesSubtitle,
                        style: tsBody.copyWith(color: kTextSub)),
                  ],
                ),
              ),
            Expanded(child: _buildBody(state, isGuest)),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(GuidesState state, bool isGuest) {
    if (state.isLoading && state.guides.isEmpty) {
      return ListView.separated(
        padding: const EdgeInsets.fromLTRB(s16, s8, s16, s32),
        itemCount: isGuest ? 3 : 4,
        separatorBuilder: (_, __) => const SizedBox(height: s12),
        itemBuilder: (_, __) => const _GuideSkeleton(),
      );
    }

    if (state.error != null && state.guides.isEmpty) {
      return MxErrorView(message: state.error!, onRetry: _reloadGuides);
    }

    if (state.guides.isEmpty) {
      final l = S.of(context)!;
      return MxEmptyState(
        icon: '🔧',
        title: isGuest ? l.sampleGuidesTitle : l.noGuidesYet,
        subtitle: isGuest ? l.sampleGuidesSubtitle : l.noGuidesDesc,
      );
    }

    return RefreshIndicator(
      color: kPrimary,
      onRefresh: _reloadGuides,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(s16, s8, s16, s32),
        itemCount: state.guides.length,
        separatorBuilder: (_, __) => const SizedBox(height: s12),
        itemBuilder: (_, i) {
          final guide = state.guides[i];
          final targetId = isGuest ? guide.resolvedGuideId : guide.id;
          return _GuideCard(
            guide: guide,
            isGuest: isGuest,
            onTap: () => context.push('/guides/$targetId'),
            onDelete: isGuest ? null : () => _confirmDelete(guide),
          );
        },
      ),
    );
  }

  void _confirmDelete(RepairGuide guide) {
    final l = S.of(context)!;
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(l.deleteGuide),
        content: Text(l.deleteGuideConfirm(guide.title)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context), child: Text(l.cancel)),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(guidesProvider.notifier).delete(guide.id);
            },
            child: Text(l.delete,
                style: const TextStyle(color: Color(0xFFDC2626))),
          ),
        ],
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  final String email;
  final VoidCallback? onProfile;
  const _TopBar({required this.email, required this.onProfile});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: s16, vertical: s12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(bottom: BorderSide(color: kBorder)),
        ),
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Motixi',
                  style: tsSubhead.copyWith(
                      color: kPrimary, fontWeight: FontWeight.w800),
                ),
                if (email.isNotEmpty)
                  Text(email, style: tsCaption.copyWith(color: kTextMuted)),
              ],
            ),
            const Spacer(),
            GestureDetector(
              onTap: onProfile,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: kPrimary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    email.isNotEmpty ? email[0].toUpperCase() : 'U',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: kPrimary,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
}

class _GuideCard extends StatelessWidget {
  final RepairGuide guide;
  final bool isGuest;
  final VoidCallback onTap;
  final VoidCallback? onDelete;

  const _GuideCard({
    required this.guide,
    required this.isGuest,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(s16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: kRadiusLg,
          border: Border.all(color: kBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Wrap(
                    spacing: s8,
                    runSpacing: s8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          MxDifficultyDot(guide.difficulty),
                          const SizedBox(width: s4),
                          Text(guide.difficulty, style: tsCaption),
                        ],
                      ),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 120),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.access_time,
                                size: 13, color: kTextMuted),
                            const SizedBox(width: s4),
                            Flexible(
                              child: Text(
                                guide.timeEstimate,
                                style: tsCaption,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      MxMetaChip(l.stepCountLabel(guide.steps.length)),
                    ],
                  ),
                ),
                if (!isGuest && onDelete != null)
                  GestureDetector(
                    onTap: onDelete,
                    child:
                        Icon(Icons.delete_outline, size: 18, color: kTextMuted),
                  ),
              ],
            ),
            const SizedBox(height: s14),
            Text(
              guide.vehicle.model,
              style: tsSectionHead,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),
            Text(
              guide.title,
              style: tsBody.copyWith(
                color: kTextSub,
                fontWeight: FontWeight.w500,
                height: 1.45,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: s14),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 124,
                  child: GuideVehicleIllustration(
                    vehicleModel: guide.vehicle.model,
                    repairLabel: guide.part.name,
                    width: double.infinity,
                    height: 92,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 10,
                    ),
                  ),
                ),
                const SizedBox(width: s12),
                Expanded(
                  child: Container(
                    height: 92,
                    padding: const EdgeInsets.all(s12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: kBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                color: kPrimaryLight,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: kPrimaryBorder),
                              ),
                              child: Center(
                                child: RepairTypeIcon(
                                  label: '${guide.part.name} ${guide.title}',
                                  size: 15,
                                ),
                              ),
                            ),
                            const SizedBox(width: s8),
                            Expanded(
                              child: Text(l.repair, style: tsLabel),
                            ),
                          ],
                        ),
                        const SizedBox(height: s10),
                        Text(
                          guide.part.name,
                          style: tsSmallBold.copyWith(
                            fontSize: 14,
                            height: 1.35,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: s12),
            Wrap(
              spacing: s8,
              runSpacing: s8,
              children: [
                RepairMetaPill(
                  label: guide.part.name,
                  iconSize: 12,
                  padding: const EdgeInsets.symmetric(
                    horizontal: s10,
                    vertical: 6,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _GuideSkeleton extends StatelessWidget {
  const _GuideSkeleton();

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(s16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: kRadiusLg,
          border: Border.all(color: kBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                MxSkeleton(width: 64, height: 22, borderRadius: kRadiusFull),
                const SizedBox(width: s8),
                MxSkeleton(width: 96, height: 22, borderRadius: kRadiusFull),
                const Spacer(),
                MxSkeleton(width: 82, height: 22, borderRadius: kRadiusFull),
              ],
            ),
            const SizedBox(height: s14),
            const MxSkeleton(
              width: 220,
              height: 22,
              borderRadius: kRadiusSm,
            ),
            const SizedBox(height: s14),
            const MxSkeleton(
              width: double.infinity,
              height: 92,
              borderRadius: kRadiusMd,
            ),
            const SizedBox(height: s12),
            const MxSkeleton(
              width: 136,
              height: 28,
              borderRadius: kRadiusFull,
            ),
          ],
        ),
      );
}
