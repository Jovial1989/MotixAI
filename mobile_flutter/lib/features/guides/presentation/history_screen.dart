import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../guides_provider.dart';
import '../../../shared/widgets/mx_widgets.dart';
import '../../../l10n/generated/app_localizations.dart';

/// History screen — same guide list as dashboard but read-only, no create bar.
class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(guidesProvider.notifier).load());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(guidesProvider);

    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: Column(
          children: [
            _Header(onBack: () => Navigator.of(context).pop()),
            Expanded(child: _buildBody(state)),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(GuidesState state) {
    if (state.isLoading && state.guides.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: kPrimary));
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
        icon: '📋',
        title: l.noHistoryYet,
        subtitle: l.noHistoryDesc,
      );
    }

    return RefreshIndicator(
      color: kPrimary,
      onRefresh: () => ref.read(guidesProvider.notifier).load(),
      child: ListView.separated(
        padding: const EdgeInsets.all(s16),
        itemCount: state.guides.length,
        separatorBuilder: (_, __) => const SizedBox(height: s12),
        itemBuilder: (_, i) {
          final guide = state.guides[i];
          return GestureDetector(
            onTap: () => context.push('/guides/${guide.id}'),
            child: Container(
              padding: const EdgeInsets.all(s16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: kRadiusLg,
                border: Border.all(color: kBorder),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(guide.title,
                            style: tsSubhead,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis),
                        const SizedBox(height: s4),
                        Text('${guide.vehicle.model} · ${guide.part.name}',
                            style: tsCaption.copyWith(color: kTextMuted)),
                        const SizedBox(height: s4),
                        Row(children: [
                          MxDifficultyDot(guide.difficulty),
                          const SizedBox(width: s4),
                          Text(guide.difficulty, style: tsCaption),
                          const SizedBox(width: s12),
                          Text('${guide.steps.length} steps', style: tsCaption),
                        ]),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: kTextMuted),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final VoidCallback onBack;
  const _Header({required this.onBack});

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: s16, vertical: s12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: kBorder)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: onBack,
            child: Icon(Icons.arrow_back_ios, size: 20, color: kPrimary),
          ),
          const SizedBox(width: s12),
          Text(l.history, style: tsSubhead),
        ],
      ),
    );
  }
}
