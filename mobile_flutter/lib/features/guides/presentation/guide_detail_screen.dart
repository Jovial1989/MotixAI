import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:photo_view/photo_view.dart';
import '../guides_provider.dart';
import '../../auth/auth_provider.dart';
import '../../../shared/api/providers.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/mx_widgets.dart';
import '../../../app/theme.dart';
import '../../../l10n/generated/app_localizations.dart';

class GuideDetailScreen extends ConsumerStatefulWidget {
  final String guideId;
  const GuideDetailScreen({super.key, required this.guideId});

  @override
  ConsumerState<GuideDetailScreen> createState() => _GuideDetailScreenState();
}

class _GuideDetailScreenState extends ConsumerState<GuideDetailScreen> {
  String? _lastLoadKey;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _loadGuideIfNeeded();
  }

  bool get _isGuest => ref.read(authProvider).tokens?.user.role == 'GUEST';

  String _languageCode() => Localizations.localeOf(context).languageCode;

  Future<void> _reloadGuide() {
    return ref.read(guideDetailProvider(widget.guideId).notifier).load(
          isGuest: _isGuest,
          language: _languageCode(),
        );
  }

  void _loadGuideIfNeeded() {
    final key = '${widget.guideId}:${_isGuest}:${_languageCode()}';
    if (_lastLoadKey == key) return;
    _lastLoadKey = key;
    Future.microtask(_reloadGuide);
  }

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    final state = ref.watch(guideDetailProvider(widget.guideId));
    final isGuest = ref.watch(authProvider).tokens?.user.role == 'GUEST';

    if (state.error != null && state.guide == null) {
      return Scaffold(
        backgroundColor: kBg,
        body: SafeArea(
          child: MxErrorView(
            message: state.error!,
            onRetry: _reloadGuide,
          ),
        ),
      );
    }

    if (state.guide == null) {
      return Scaffold(
        backgroundColor: kBg,
        body: const Center(child: CircularProgressIndicator(color: kPrimary)),
      );
    }

    final guide = state.guide!;
    final steps = guide.steps;
    final currentStep = steps.isNotEmpty ? steps[state.stepIndex] : null;
    final readyCount =
        steps.where((s) => s.imageStatus == ImageStatus.ready).length;
    final allReady = readyCount == steps.length;

    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: Column(
          children: [
            // ── Sticky top header ──
            _GuideHeader(
              guide: guide,
              stepIndex: state.stepIndex,
              allReady: allReady,
              readyCount: readyCount,
              onBack: () => Navigator.of(context).pop(),
            ),

            // ── Content ──
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(s16, s16, s16, s8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Safety notes (collapsible)
                    if (guide.safetyNotes.isNotEmpty) ...[
                      MxCollapsibleCard(
                        borderColor: kWarning.withOpacity(0.4),
                        bgColor: kWarningLight,
                        header: Row(
                          children: [
                            const Text('⚠️', style: TextStyle(fontSize: 14)),
                            const SizedBox(width: s8),
                            Text(l.safetyNotes,
                                style: tsSmallBold.copyWith(color: kWarning)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: guide.safetyNotes
                              .map((note) => Padding(
                                    padding: const EdgeInsets.only(bottom: s8),
                                    child: Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          width: 5,
                                          height: 5,
                                          margin: const EdgeInsets.only(
                                              top: 7, right: 8),
                                          decoration: const BoxDecoration(
                                              color: kWarning,
                                              shape: BoxShape.circle),
                                        ),
                                        Expanded(
                                            child: Text(note,
                                                style: tsCaption.copyWith(
                                                    color:
                                                        const Color(0xFF78350F),
                                                    fontWeight:
                                                        FontWeight.w400))),
                                      ],
                                    ),
                                  ))
                              .toList(),
                        ),
                      ),
                      const SizedBox(height: s12),
                    ],

                    // Tools (collapsible)
                    if (guide.tools.isNotEmpty) ...[
                      MxCollapsibleCard(
                        header: Row(
                          children: [
                            const Text('🔧', style: TextStyle(fontSize: 14)),
                            const SizedBox(width: s8),
                            Text(l.toolsRequired, style: tsSmallBold),
                          ],
                        ),
                        child: Wrap(
                          spacing: s8,
                          runSpacing: s8,
                          children: guide.tools.map((t) => MxChip(t)).toList(),
                        ),
                      ),
                      const SizedBox(height: s16),
                    ],

                    // Step header
                    Text(l.procedureSteps(steps.length), style: tsLabel),
                    const SizedBox(height: s12),

                    // Current step card
                    if (currentStep != null)
                      _StepCard(
                        step: currentStep,
                        guideId: widget.guideId,
                        isGuest: isGuest,
                        onRetry: () => ref
                            .read(guideDetailProvider(widget.guideId).notifier)
                            .retryStepImage(currentStep.id),
                      ),

                    const SizedBox(height: s16),
                  ],
                ),
              ),
            ),

            // ── Sticky bottom navigator ──
            if (steps.length > 1)
              _StepNavigator(
                stepIndex: state.stepIndex,
                total: steps.length,
                onPrev: () => ref
                    .read(guideDetailProvider(widget.guideId).notifier)
                    .prevStep(),
                onNext: () => ref
                    .read(guideDetailProvider(widget.guideId).notifier)
                    .nextStep(),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Guide header ───────────────────────────────────────────────────────────────

class _GuideHeader extends StatelessWidget {
  final RepairGuide guide;
  final int stepIndex;
  final bool allReady;
  final int readyCount;
  final VoidCallback onBack;

  const _GuideHeader({
    required this.guide,
    required this.stepIndex,
    required this.allReady,
    required this.readyCount,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    final steps = guide.steps;
    final progress = steps.isNotEmpty ? (stepIndex + 1) / steps.length : 0.0;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: kBorder)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4)
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(s16, s12, s16, 0),
            child: Row(
              children: [
                // Back
                GestureDetector(
                  onTap: onBack,
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: kBg,
                      shape: BoxShape.circle,
                      border: Border.all(color: kBorder),
                    ),
                    child: const Icon(Icons.arrow_back_ios,
                        size: 16, color: kPrimary),
                  ),
                ),
                const SizedBox(width: s12),
                // Vehicle + part
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(guide.vehicle.model,
                          style: tsCaption.copyWith(color: kTextMuted)),
                      Text(guide.part.name,
                          style: tsSmallBold, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                // Time + image status
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: s8, vertical: s4),
                      decoration: BoxDecoration(
                        color: kPrimaryLight,
                        borderRadius: kRadiusFull,
                        border: Border.all(color: kPrimaryBorder),
                      ),
                      child: Text('⏱ ${guide.timeEstimate}',
                          style: tsCaption.copyWith(
                              color: kPrimaryDark,
                              fontWeight: FontWeight.w600)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      allReady
                          ? l.procedureSteps(steps.length)
                          : '$readyCount/${steps.length}',
                      style: tsCaption.copyWith(color: kTextMuted),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: s8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: s16),
            child: Text(guide.title,
                style: tsStepTitle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis),
          ),
          // Source badge
          if (guide.source != null) ...[
            const SizedBox(height: s4),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: s16),
              child: _SourceBadge(guide: guide),
            ),
          ],
          const SizedBox(height: s10),
          // Progress bar
          LinearProgressIndicator(
            value: progress,
            backgroundColor: kBorder,
            color: kPrimary,
            minHeight: 3,
          ),
        ],
      ),
    );
  }
}

// ── Step card ─────────────────────────────────────────────────────────────────

class _StepCard extends StatefulWidget {
  final RepairStep step;
  final String guideId;
  final bool isGuest;
  final VoidCallback onRetry;
  const _StepCard({
    required this.step,
    required this.guideId,
    required this.isGuest,
    required this.onRetry,
  });

  @override
  State<_StepCard> createState() => _StepCardState();
}

class _StepCardState extends State<_StepCard> {
  bool _detailsExpanded = false;

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    final step = widget.step;
    final hasDetails = step.torqueValue != null || step.warningNote != null;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: kRadiusLg,
        border: Border.all(color: kBorder),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(s16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Number pill + title
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                          color: kPrimary, shape: BoxShape.circle),
                      child: Center(
                        child: Text('${step.stepOrder}',
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 16)),
                      ),
                    ),
                    const SizedBox(width: s12),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(step.title, style: tsSectionHead),
                      ),
                    ),
                  ],
                ),

                // Image
                const SizedBox(height: s16),
                _StepImage(
                    step: step,
                    isGuest: widget.isGuest,
                    onRetry: widget.onRetry),

                // Instruction
                const SizedBox(height: s16),
                _StepInstruction(instruction: step.instruction),

                // Expandable details
                if (hasDetails) ...[
                  const SizedBox(height: s12),
                  GestureDetector(
                    onTap: () =>
                        setState(() => _detailsExpanded = !_detailsExpanded),
                    child: Row(
                      children: [
                        Text(l.details,
                            style: tsSmallBold.copyWith(color: kPrimary)),
                        const SizedBox(width: s4),
                        Icon(
                          _detailsExpanded
                              ? Icons.keyboard_arrow_up
                              : Icons.keyboard_arrow_down,
                          size: 18,
                          color: kPrimary,
                        ),
                      ],
                    ),
                  ),
                  if (_detailsExpanded) ...[
                    const SizedBox(height: s10),
                    if (step.torqueValue != null)
                      _SpecChip(
                        icon: '🔩',
                        label: l.torque,
                        value: step.torqueValue!,
                        bg: kSuccessLight,
                        border: kSuccessBorder,
                        textColor: kSuccess,
                      ),
                    if (step.warningNote != null) ...[
                      const SizedBox(height: s8),
                      _SpecChip(
                        icon: '⚠️',
                        label: step.warningNote!,
                        bg: kWarningLight,
                        border: kWarningBorder,
                        textColor: kWarning,
                      ),
                    ],
                  ],
                ],

                // Ask AI
                const SizedBox(height: s16),
                _AskAiWidget(
                    guideId: widget.guideId,
                    step: step,
                    isGuest: widget.isGuest),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SpecChip extends StatelessWidget {
  final String icon;
  final String label;
  final String? value;
  final Color bg;
  final Color border;
  final Color textColor;

  const _SpecChip({
    required this.icon,
    required this.label,
    this.value,
    required this.bg,
    required this.border,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: s12, vertical: s8),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: kRadiusMd,
          border: Border.all(color: border),
        ),
        child: Row(
          children: [
            Text(icon, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: s8),
            Text(label, style: tsSmallBold.copyWith(color: textColor)),
            if (value != null) ...[
              const SizedBox(width: s8),
              Text(value!,
                  style: tsSmallBold.copyWith(
                      color: textColor, fontWeight: FontWeight.w800)),
            ],
          ],
        ),
      );
}

// ── Step image ─────────────────────────────────────────────────────────────────

class _StepImage extends StatefulWidget {
  final RepairStep step;
  final bool isGuest;
  final VoidCallback onRetry;
  const _StepImage({
    required this.step,
    required this.isGuest,
    required this.onRetry,
  });

  @override
  State<_StepImage> createState() => _StepImageState();
}

class _StepImageState extends State<_StepImage>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _anim = Tween(begin: 0.3, end: 0.8).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _openFullscreen(BuildContext context) {
    final url = widget.step.imageUrl;
    if (url == null) return;
    Navigator.of(context).push(MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => _FullscreenImage(imageUrl: url),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    final step = widget.step;

    if (step.imageStatus == ImageStatus.ready && step.imageUrl != null) {
      return GestureDetector(
        onTap: () => _openFullscreen(context),
        child: Stack(
          children: [
            ClipRRect(
              borderRadius: kRadiusMd,
              child: Image(
                image: _resolveImage(step.imageUrl!),
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _placeholder(),
              ),
            ),
            Positioned(
              bottom: s8,
              right: s8,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: s8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.55),
                  borderRadius: kRadiusSm,
                ),
                child: Text('⤢ ${l.tapToExpand}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w500)),
              ),
            ),
          ],
        ),
      );
    }

    if (step.isPending) {
      final statusLabel = switch (step.imageStatus) {
        ImageStatus.searchingRefs => l.searchingRefs,
        ImageStatus.analyzingRefs => l.analyzingRefs,
        ImageStatus.generating => l.generatingIllustration,
        _ => l.queued,
      };
      return FadeTransition(
        opacity: _anim,
        child: Container(
          width: double.infinity,
          height: 140,
          decoration: BoxDecoration(
            color: kBorder,
            borderRadius: kRadiusMd,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(color: kPrimary, strokeWidth: 2),
              const SizedBox(height: s8),
              Text(statusLabel,
                  style: tsCaption.copyWith(fontWeight: FontWeight.w400)),
            ],
          ),
        ),
      );
    }

    if (step.imageStatus == ImageStatus.failed) {
      if (widget.isGuest) {
        return _loadingShell(l.generatingIllustration);
      }
      // Show the fallback image the backend saved (placehold.co or last known URL),
      // plus a retry button underneath. Never show an empty block.
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (step.imageUrl != null)
            ClipRRect(
              borderRadius: kRadiusMd,
              child: Image(
                image: _resolveImage(step.imageUrl!),
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _placeholder(),
              ),
            ),
          const SizedBox(height: 6),
          GestureDetector(
            onTap: widget.onRetry,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: kErrorLight,
                borderRadius: kRadiusMd,
                border: Border.all(color: const Color(0xFFFCA5A5)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('⟳',
                      style: TextStyle(fontSize: 16, color: Color(0xFFDC2626))),
                  const SizedBox(width: 6),
                  Text(l.tapToRegenerate,
                      style:
                          tsCaption.copyWith(color: const Color(0xFFDC2626))),
                ],
              ),
            ),
          ),
        ],
      );
    }

    // none state: triggering hasn't completed yet — show a lightweight queued indicator
    // so the user always sees feedback instead of an empty block.
    return _loadingShell(l.preparingIllustration);
  }

  Widget _loadingShell(String label) => FadeTransition(
        opacity: _anim,
        child: Container(
          width: double.infinity,
          height: 100,
          decoration: BoxDecoration(
            color: kBorder,
            borderRadius: kRadiusMd,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(color: kPrimary, strokeWidth: 2),
              const SizedBox(height: 8),
              Text(label,
                  style: tsCaption.copyWith(fontWeight: FontWeight.w400)),
            ],
          ),
        ),
      );

  Widget _placeholder() => Container(
        width: double.infinity,
        height: 200,
        decoration: BoxDecoration(color: kBorder, borderRadius: kRadiusMd),
        child: const Icon(Icons.broken_image_outlined,
            color: Colors.white54, size: 40),
      );
}

/// Resolves a URL that may be either an HTTPS URL or a base64 data URI.
/// Flutter's NetworkImage cannot handle data: URIs, so we decode them to MemoryImage.
ImageProvider _resolveImage(String url) {
  if (url.startsWith('data:')) {
    final commaIndex = url.indexOf(',');
    if (commaIndex != -1) {
      final data = url.substring(commaIndex + 1);
      try {
        return MemoryImage(base64Decode(data));
      } catch (_) {}
    }
  }
  return NetworkImage(url);
}

class _FullscreenImage extends StatelessWidget {
  final String imageUrl;
  const _FullscreenImage({required this.imageUrl});

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: PhotoView(imageProvider: _resolveImage(imageUrl)),
      );
}

// ── Step navigator ─────────────────────────────────────────────────────────────

class _StepNavigator extends StatelessWidget {
  final int stepIndex;
  final int total;
  final VoidCallback onPrev;
  final VoidCallback onNext;

  const _StepNavigator({
    required this.stepIndex,
    required this.total,
    required this.onPrev,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    return Container(
      height: 72,
      padding: const EdgeInsets.symmetric(horizontal: s16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: kBorder)),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 8,
              offset: const Offset(0, -2))
        ],
      ),
      child: Row(
        children: [
          // Prev
          OutlinedButton.icon(
            onPressed: stepIndex > 0 ? onPrev : null,
            icon: const Icon(Icons.arrow_back_ios, size: 14),
            label: Text(l.prev),
            style: OutlinedButton.styleFrom(
              foregroundColor: kPrimary,
              side: BorderSide(color: stepIndex > 0 ? kPrimary : kBorder),
              padding:
                  const EdgeInsets.symmetric(horizontal: s16, vertical: s10),
              shape: RoundedRectangleBorder(borderRadius: kRadiusMd),
            ),
          ),

          // Counter
          Expanded(
            child: Center(
              child: Text(l.stepOf(stepIndex + 1, total),
                  style: tsSubhead.copyWith(color: kTextSub)),
            ),
          ),

          // Next
          FilledButton.icon(
            onPressed: stepIndex < total - 1 ? onNext : null,
            icon: Text(l.next),
            label: const Icon(Icons.arrow_forward_ios, size: 14),
            style: FilledButton.styleFrom(
              backgroundColor: kPrimary,
              padding:
                  const EdgeInsets.symmetric(horizontal: s16, vertical: s10),
              shape: RoundedRectangleBorder(borderRadius: kRadiusMd),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Step instruction renderer ─────────────────────────────────────────────────
// Renders "1. Action\n2. Action\n3. Action" as a numbered list with styled badges.
// Falls back to plain text for legacy non-numbered instructions.
class _StepInstruction extends StatelessWidget {
  final String instruction;
  const _StepInstruction({required this.instruction});

  @override
  Widget build(BuildContext context) {
    final lines =
        instruction.split('\n').where((l) => l.trim().isNotEmpty).toList();
    final isNumbered = lines.any((l) => RegExp(r'^\d+\.\s').hasMatch(l));

    if (!isNumbered) {
      return Text(instruction, style: tsBodyMd);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: lines.map((line) {
        final match = RegExp(r'^(\d+)\.\s+(.*)').firstMatch(line);
        if (match == null) return Text(line, style: tsBodyMd);
        return Padding(
          padding: const EdgeInsets.only(bottom: s8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 22,
                height: 22,
                margin: const EdgeInsets.only(top: 1, right: s8),
                decoration: BoxDecoration(
                  color: kPrimary.withValues(alpha: 0.1),
                  border: Border.all(color: kPrimary.withValues(alpha: 0.3)),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    match.group(1)!,
                    style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: kPrimary),
                  ),
                ),
              ),
              Expanded(child: Text(match.group(2)!, style: tsBodyMd)),
            ],
          ),
        );
      }).toList(),
    );
  }
}

// ── Source badge ───────────────────────────────────────────────────────────────

class _SourceBadge extends StatelessWidget {
  final RepairGuide guide;
  const _SourceBadge({required this.guide});

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: s8, vertical: s4),
      decoration: BoxDecoration(
        color: kPrimaryLight,
        borderRadius: kRadiusFull,
        border: Border.all(color: kPrimaryBorder),
      ),
      child: Text(l.aiGenerated,
          style: tsCaption.copyWith(
              color: kPrimaryDark, fontWeight: FontWeight.w600)),
    );
  }
}

// ── Ask AI widget ──────────────────────────────────────────────────────────────

class _AskAiWidget extends ConsumerStatefulWidget {
  final String guideId;
  final RepairStep step;
  final bool isGuest;
  const _AskAiWidget({
    required this.guideId,
    required this.step,
    required this.isGuest,
  });

  @override
  ConsumerState<_AskAiWidget> createState() => _AskAiWidgetState();
}

class _AskAiWidgetState extends ConsumerState<_AskAiWidget> {
  final _ctrl = TextEditingController();
  bool _loading = false;
  String? _answer;
  String? _error;
  bool _expanded = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final l = S.of(context)!;
    if (widget.isGuest) {
      _showGuestProSheet(l);
      return;
    }
    final q = _ctrl.text.trim();
    if (q.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
      _answer = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      final locale = Localizations.localeOf(context).languageCode;
      final answer = await api.askGuideStep(widget.guideId, widget.step.id, q,
          language: locale);
      if (mounted)
        setState(() {
          _answer = answer;
          _loading = false;
        });
    } catch (e) {
      if (mounted)
        setState(() {
          _error = e.toString();
          _loading = false;
        });
    }
  }

  void _showGuestProSheet(S l) {
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
                child: Icon(Icons.lock_outline, color: kPrimary, size: 24),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              l.availableInPro,
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
                  if (mounted) context.go('/signup');
                },
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFEA580C),
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  l.startFreeTrial,
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15),
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
    return Container(
      decoration: BoxDecoration(
        color: kBgSubtle,
        borderRadius: kRadiusMd,
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header toggle
          GestureDetector(
            onTap: () => setState(() {
              _expanded = !_expanded;
            }),
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: s12, vertical: s10),
              child: Row(
                children: [
                  const Text('🤖', style: TextStyle(fontSize: 14)),
                  const SizedBox(width: s8),
                  Text(l.askAiAboutStep,
                      style: tsSmallBold.copyWith(color: kPrimary)),
                  const Spacer(),
                  Icon(
                      _expanded
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard_arrow_down,
                      size: 18,
                      color: kPrimary),
                ],
              ),
            ),
          ),

          if (_expanded) ...[
            Divider(height: 1, color: kBorder),
            Padding(
              padding: const EdgeInsets.all(s12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Input row
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _ctrl,
                          minLines: 1,
                          maxLines: 3,
                          style: tsBodyMd,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _submit(),
                          decoration: InputDecoration(
                            hintText: l.askAiHint,
                            hintStyle: tsCaption.copyWith(color: kTextMuted),
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: s12, vertical: s10),
                            border: OutlineInputBorder(
                              borderRadius: kRadiusMd,
                              borderSide: BorderSide(color: kBorder),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: kRadiusMd,
                              borderSide: BorderSide(color: kBorder),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: kRadiusMd,
                              borderSide:
                                  BorderSide(color: kPrimary, width: 1.5),
                            ),
                            filled: true,
                            fillColor: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: s8),
                      SizedBox(
                        width: 44,
                        height: 44,
                        child: FilledButton(
                          onPressed: _loading ? null : _submit,
                          style: FilledButton.styleFrom(
                            backgroundColor: kPrimary,
                            padding: EdgeInsets.zero,
                            shape:
                                RoundedRectangleBorder(borderRadius: kRadiusMd),
                          ),
                          child: _loading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                      color: Colors.white, strokeWidth: 2))
                              : const Icon(Icons.send,
                                  size: 18, color: Colors.white),
                        ),
                      ),
                    ],
                  ),

                  // Answer
                  if (_answer != null) ...[
                    const SizedBox(height: s10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(s12),
                      decoration: BoxDecoration(
                        color: kPrimaryLight,
                        borderRadius: kRadiusMd,
                        border: Border.all(color: kPrimaryBorder),
                      ),
                      child: Text(_answer!, style: tsBodyMd),
                    ),
                  ],

                  // Error
                  if (_error != null) ...[
                    const SizedBox(height: s10),
                    GestureDetector(
                      onTap: _submit,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(s12),
                        decoration: BoxDecoration(
                          color: kErrorLight,
                          borderRadius: kRadiusMd,
                          border: Border.all(color: const Color(0xFFFCA5A5)),
                        ),
                        child: Row(
                          children: [
                            const Text('⟳',
                                style: TextStyle(
                                    fontSize: 16, color: Color(0xFFDC2626))),
                            const SizedBox(width: s8),
                            Expanded(
                              child: Text(_error!,
                                  style: tsCaption.copyWith(
                                      color: const Color(0xFFDC2626))),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
