import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../guides_provider.dart';
import '../../auth/auth_provider.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/mx_widgets.dart';
import '../../../app/theme.dart';
import '../../../l10n/generated/app_localizations.dart';
import 'guide_create_sheet.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(guidesProvider.notifier).load());
  }

  Future<void> _openCreateSheet() async {
    final authState = ref.read(authProvider);
    final isGuest = authState.tokens?.user.role == 'GUEST';
    if (isGuest) {
      _showGuestAuthSheet();
      return;
    }
    final data = await showGuideCreateSheet(context);
    if (data == null || !mounted) return;
    setState(() => _creating = true);
    final locale = Localizations.localeOf(context).languageCode;
    final guide = await ref.read(guidesProvider.notifier).create(
      data.vehicleModel,
      data.partName,
      oemNumber: data.oemNumber,
      language: locale,
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
            Container(width: 36, height: 4, decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2),
            )),
            const SizedBox(height: 24),
            Container(
              width: 52, height: 52, decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED), borderRadius: BorderRadius.circular(26),
                border: Border.all(color: const Color(0xFFFDBA74)),
              ),
              child: const Center(child: Text('✦', style: TextStyle(fontSize: 22))),
            ),
            const SizedBox(height: 16),
            const Text('Create an account to generate guides',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
              textAlign: TextAlign.center),
            const SizedBox(height: 6),
            Text('Sign up for free to generate AI repair guides for any vehicle.',
              style: TextStyle(fontSize: 13, color: Colors.grey[600], height: 1.5),
              textAlign: TextAlign.center),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () { Navigator.pop(context); context.go('/signup'); },
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFEA580C),
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(l.createAccount, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () { Navigator.pop(context); context.go('/login'); },
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                child: Text(l.signIn, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF0F172A))),
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
            ? const SizedBox(width: 18, height: 18,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Icon(isGuest ? Icons.lock_outline : Icons.add),
        label: Text(_creating ? l.generating : (isGuest ? l.signUpToGenerate : l.newGuide),
          style: const TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ── Top bar ──
            _TopBar(
              email: authState.tokens?.user.email ?? '',
              onProfile: isGuest ? null : () => context.push('/profile'),
            ),

            // ── Guest banner ──
            if (isGuest)
              Container(
                margin: const EdgeInsets.fromLTRB(s16, s8, s16, 0),
                padding: const EdgeInsets.symmetric(horizontal: s12, vertical: s10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Row(children: [
                  const Icon(Icons.info_outline, size: 15, color: Color(0xFFD97706)),
                  const SizedBox(width: s8),
                  Expanded(child: Text(
                    l.guestBanner,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF92400E)),
                  )),
                  GestureDetector(
                    onTap: () => context.go('/signup'),
                    child: Text(l.guestBannerSignUp, style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFFEA580C),
                      decoration: TextDecoration.underline,
                    )),
                  ),
                ]),
              ),

            // ── Guides list ──
            Expanded(child: _buildBody(state)),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(GuidesState state) {
    if (state.isLoading && state.guides.isEmpty) {
      return ListView.separated(
        padding: const EdgeInsets.all(s16),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: s12),
        itemBuilder: (_, __) => _GuideSkeleton(),
      );
    }

    if (state.error != null && state.guides.isEmpty) {
      return MxErrorView(
        message: state.error!,
        onRetry: () => ref.read(guidesProvider.notifier).load(),
      );
    }

    if (state.guides.isEmpty) {
      final l = S.of(context)!;
      return MxEmptyState(
        icon: '🔧',
        title: l.noGuidesYet,
        subtitle: l.noGuidesDesc,
      );
    }

    return RefreshIndicator(
      color: kPrimary,
      onRefresh: () => ref.read(guidesProvider.notifier).load(),
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(s16, s8, s16, s32),
        itemCount: state.guides.length,
        separatorBuilder: (_, __) => const SizedBox(height: s12),
        itemBuilder: (_, i) => _GuideCard(
          guide: state.guides[i],
          onTap: () => context.push('/guides/${state.guides[i].id}'),
          onDelete: () => _confirmDelete(state.guides[i]),
        ),
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
          TextButton(onPressed: () => Navigator.pop(context), child: Text(l.cancel)),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(guidesProvider.notifier).delete(guide.id);
            },
            child: Text(l.delete, style: const TextStyle(color: Color(0xFFDC2626))),
          ),
        ],
      ),
    );
  }
}

// ── Widgets ───────────────────────────────────────────────────────────────────

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
            Text('Motixi', style: tsSubhead.copyWith(color: kPrimary, fontWeight: FontWeight.w800)),
            if (email.isNotEmpty)
              Text(email, style: tsCaption.copyWith(color: kTextMuted)),
          ],
        ),
        const Spacer(),
        GestureDetector(
          onTap: onProfile,
          child: Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: kPrimary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                email.isNotEmpty ? email[0].toUpperCase() : 'U',
                style: const TextStyle(fontWeight: FontWeight.w700, color: kPrimary, fontSize: 16),
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
  final VoidCallback onTap;
  final VoidCallback onDelete;
  const _GuideCard({required this.guide, required this.onTap, required this.onDelete});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(s16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: kRadiusLg,
        border: Border.all(color: kBorder),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(guide.title, style: tsSubhead,
                  maxLines: 2, overflow: TextOverflow.ellipsis),
              ),
              const SizedBox(width: s8),
              GestureDetector(
                onTap: onDelete,
                child: Icon(Icons.delete_outline, size: 18, color: kTextMuted),
              ),
            ],
          ),
          const SizedBox(height: s8),
          Row(
            children: [
              MxDifficultyDot(guide.difficulty),
              const SizedBox(width: s4),
              Text(guide.difficulty, style: tsCaption),
              const SizedBox(width: s12),
              Icon(Icons.access_time, size: 13, color: kTextMuted),
              const SizedBox(width: s4),
              Text(guide.timeEstimate, style: tsCaption),
              const SizedBox(width: s12),
              Expanded(
                child: Text(guide.vehicle.model, style: tsCaption,
                  overflow: TextOverflow.ellipsis),
              ),
            ],
          ),
          const SizedBox(height: s8),
          Row(
            children: [
              MxMetaChip(guide.part.name),
              const SizedBox(width: s4),
              MxMetaChip('${guide.steps.length} steps'),
            ],
          ),
        ],
      ),
    ),
  );
}

class _GuideSkeleton extends StatelessWidget {
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
        MxSkeleton(width: double.infinity, height: 20, borderRadius: kRadiusSm),
        const SizedBox(height: s8),
        MxSkeleton(width: 200, height: 14, borderRadius: kRadiusSm),
        const SizedBox(height: s12),
        Row(children: [
          MxSkeleton(width: 60, height: 22, borderRadius: kRadiusFull),
          const SizedBox(width: s8),
          MxSkeleton(width: 80, height: 22, borderRadius: kRadiusFull),
        ]),
      ],
    ),
  );
}
