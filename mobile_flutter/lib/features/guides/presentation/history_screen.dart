import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../guides_provider.dart';
import 'guide_visuals.dart';
import '../../../shared/widgets/mx_widgets.dart';
import '../../../l10n/generated/app_localizations.dart';

/// History screen — same guide list as dashboard but read-only, no create bar.
class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  String? _lastLoadKey;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _loadGuidesIfNeeded();
  }

  String _languageCode() => Localizations.localeOf(context).languageCode;

  Future<void> _reloadGuides() {
    return ref.read(guidesProvider.notifier).load(
          language: _languageCode(),
        );
  }

  void _loadGuidesIfNeeded() {
    final key = _languageCode();
    if (_lastLoadKey == key) return;
    _lastLoadKey = key;
    Future.microtask(_reloadGuides);
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
    final l = S.of(context)!;

    if (state.isLoading && state.guides.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: kPrimary));
    }

    if (state.error != null && state.guides.isEmpty) {
      return MxErrorView(
        message: state.error!,
        onRetry: _reloadGuides,
      );
    }

    if (state.guides.isEmpty) {
      return MxEmptyState(
        icon: '📋',
        title: l.noHistoryYet,
        subtitle: l.noHistoryDesc,
      );
    }

    return RefreshIndicator(
      color: kPrimary,
      onRefresh: _reloadGuides,
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
              child: Column(
                children: [
                  Row(
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
                      const SizedBox(width: s8),
                      const Icon(Icons.chevron_right, color: kTextMuted),
                    ],
                  ),
                  const SizedBox(height: s14),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      guide.vehicle.model,
                      style: tsSectionHead,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: s14),
                  GuideVehicleIllustration(
                    vehicleModel: guide.vehicle.model,
                    repairLabel: guide.part.name,
                    width: double.infinity,
                    height: 156,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 14,
                    ),
                  ),
                  const SizedBox(height: s14),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(l.repair, style: tsLabel),
                  ),
                  const SizedBox(height: 6),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: RepairMetaPill(
                      label: guide.part.name,
                      iconSize: 13,
                    ),
                  ),
                  const SizedBox(height: s10),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      guide.title,
                      style: tsBody.copyWith(
                        color: kTextSub,
                        fontWeight: FontWeight.w500,
                        height: 1.45,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
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
