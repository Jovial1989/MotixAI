import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../guides_provider.dart';
import '../../auth/auth_provider.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/mx_widgets.dart';
import '../../../app/theme.dart';
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
    final data = await showGuideCreateSheet(context);
    if (data == null || !mounted) return;
    setState(() => _creating = true);
    final guide = await ref.read(guidesProvider.notifier).create(
      data.vehicleModel,
      data.partName,
      oemNumber: data.oemNumber,
    );
    setState(() => _creating = false);
    if (!mounted) return;
    if (guide != null) context.push('/guides/${guide.id}');
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(guidesProvider);
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: kBg,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _creating ? null : _openCreateSheet,
        backgroundColor: kPrimary,
        foregroundColor: Colors.white,
        icon: _creating
            ? const SizedBox(width: 18, height: 18,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Icon(Icons.add),
        label: Text(_creating ? 'Generating…' : 'New guide',
          style: const TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ── Top bar ──
            _TopBar(
              email: authState.tokens?.user.email ?? '',
              onProfile: () => context.push('/profile'),
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
      return const MxEmptyState(
        icon: '🔧',
        title: 'No guides yet',
        subtitle: 'Type a repair query above to generate your first AI-powered guide.',
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
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete guide'),
        content: Text('Delete "${guide.title}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(guidesProvider.notifier).delete(guide.id);
            },
            child: const Text('Delete', style: TextStyle(color: Color(0xFFDC2626))),
          ),
        ],
      ),
    );
  }
}

// ── Widgets ───────────────────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  final String email;
  final VoidCallback onProfile;
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
            Text('MotixAI', style: tsSubhead.copyWith(color: kPrimary, fontWeight: FontWeight.w800)),
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
