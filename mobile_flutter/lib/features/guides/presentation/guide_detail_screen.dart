import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:photo_view/photo_view.dart';
import '../guides_provider.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/mx_widgets.dart';
import '../../../app/theme.dart';

class GuideDetailScreen extends ConsumerStatefulWidget {
  final String guideId;
  const GuideDetailScreen({super.key, required this.guideId});

  @override
  ConsumerState<GuideDetailScreen> createState() => _GuideDetailScreenState();
}

class _GuideDetailScreenState extends ConsumerState<GuideDetailScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() =>
        ref.read(guideDetailProvider(widget.guideId).notifier).load());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(guideDetailProvider(widget.guideId));

    if (state.error != null && state.guide == null) {
      return Scaffold(
        backgroundColor: kBg,
        body: SafeArea(
          child: MxErrorView(
            message: state.error!,
            onRetry: () => ref.read(guideDetailProvider(widget.guideId).notifier).load(),
          ),
        ),
      );
    }

    if (state.isLoading && state.guide == null) {
      return Scaffold(
        backgroundColor: kBg,
        body: const Center(child: CircularProgressIndicator(color: kPrimary)),
      );
    }

    final guide = state.guide!;
    final steps = guide.steps;
    final currentStep = steps.isNotEmpty ? steps[state.stepIndex] : null;
    final readyCount = steps.where((s) => s.imageStatus == ImageStatus.ready).length;
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
                            Text('Safety notes (${guide.safetyNotes.length})',
                              style: tsSmallBold.copyWith(color: kWarning)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: guide.safetyNotes.map((note) => Padding(
                            padding: const EdgeInsets.only(bottom: s8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 5, height: 5, margin: const EdgeInsets.only(top: 7, right: 8),
                                  decoration: const BoxDecoration(color: kWarning, shape: BoxShape.circle),
                                ),
                                Expanded(child: Text(note,
                                  style: tsCaption.copyWith(color: const Color(0xFF78350F), fontWeight: FontWeight.w400))),
                              ],
                            ),
                          )).toList(),
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
                            Text('Tools required (${guide.tools.length})',
                              style: tsSmallBold),
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
                    Text('PROCEDURE — ${steps.length} STEPS', style: tsLabel),
                    const SizedBox(height: s12),

                    // Current step card
                    if (currentStep != null)
                      _StepCard(
                        step: currentStep,
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
                onPrev: () => ref.read(guideDetailProvider(widget.guideId).notifier).prevStep(),
                onNext: () => ref.read(guideDetailProvider(widget.guideId).notifier).nextStep(),
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
    final steps = guide.steps;
    final progress = steps.isNotEmpty ? (stepIndex + 1) / steps.length : 0.0;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: kBorder)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4)],
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
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      color: kBg,
                      shape: BoxShape.circle,
                      border: Border.all(color: kBorder),
                    ),
                    child: const Icon(Icons.arrow_back_ios, size: 16, color: kPrimary),
                  ),
                ),
                const SizedBox(width: s12),
                // Vehicle + part
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(guide.vehicle.model, style: tsCaption.copyWith(color: kTextMuted)),
                      Text(guide.part.name, style: tsSmallBold, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                // Time + image status
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: s8, vertical: s4),
                      decoration: BoxDecoration(
                        color: kPrimaryLight,
                        borderRadius: kRadiusFull,
                        border: Border.all(color: kPrimaryBorder),
                      ),
                      child: Text('⏱ ${guide.timeEstimate}',
                        style: tsCaption.copyWith(color: kPrimaryDark, fontWeight: FontWeight.w600)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      allReady
                          ? '${steps.length} steps ready'
                          : '$readyCount/${steps.length} illustrations',
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
            child: Text(guide.title, style: tsStepTitle,
              maxLines: 2, overflow: TextOverflow.ellipsis),
          ),
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
  final VoidCallback onRetry;
  const _StepCard({required this.step, required this.onRetry});

  @override
  State<_StepCard> createState() => _StepCardState();
}

class _StepCardState extends State<_StepCard> {
  bool _detailsExpanded = false;

  @override
  Widget build(BuildContext context) {
    final step = widget.step;
    final hasDetails = step.torqueValue != null || step.warningNote != null;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: kRadiusLg,
        border: Border.all(color: kBorder),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
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
                      width: 40, height: 40,
                      decoration: const BoxDecoration(color: kPrimary, shape: BoxShape.circle),
                      child: Center(
                        child: Text('${step.stepOrder}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
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
                _StepImage(step: step, onRetry: widget.onRetry),

                // Instruction
                const SizedBox(height: s16),
                Text(step.instruction, style: tsBodyMd),

                // Expandable details
                if (hasDetails) ...[
                  const SizedBox(height: s12),
                  GestureDetector(
                    onTap: () => setState(() => _detailsExpanded = !_detailsExpanded),
                    child: Row(
                      children: [
                        Text('Details', style: tsSmallBold.copyWith(color: kPrimary)),
                        const SizedBox(width: s4),
                        Icon(
                          _detailsExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                          size: 18, color: kPrimary,
                        ),
                      ],
                    ),
                  ),
                  if (_detailsExpanded) ...[
                    const SizedBox(height: s10),
                    if (step.torqueValue != null)
                      _SpecChip(
                        icon: '🔩',
                        label: 'Torque',
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
          Text(value!, style: tsSmallBold.copyWith(color: textColor, fontWeight: FontWeight.w800)),
        ],
      ],
    ),
  );
}

// ── Step image ─────────────────────────────────────────────────────────────────

class _StepImage extends StatefulWidget {
  final RepairStep step;
  final VoidCallback onRetry;
  const _StepImage({required this.step, required this.onRetry});

  @override
  State<_StepImage> createState() => _StepImageState();
}

class _StepImageState extends State<_StepImage> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
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
    final step = widget.step;

    if (step.imageStatus == ImageStatus.ready && step.imageUrl != null) {
      return GestureDetector(
        onTap: () => _openFullscreen(context),
        child: Stack(
          children: [
            ClipRRect(
              borderRadius: kRadiusMd,
              child: Image.network(
                step.imageUrl!,
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _placeholder(),
              ),
            ),
            Positioned(
              bottom: s8, right: s8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: s8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.55),
                  borderRadius: kRadiusSm,
                ),
                child: const Text('⤢ Tap to expand',
                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500)),
              ),
            ),
          ],
        ),
      );
    }

    if (step.isPending) {
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
              Text('Generating illustration…', style: tsCaption.copyWith(fontWeight: FontWeight.w400)),
            ],
          ),
        ),
      );
    }

    if (step.imageStatus == ImageStatus.failed) {
      return GestureDetector(
        onTap: widget.onRetry,
        child: Container(
          width: double.infinity,
          height: 72,
          decoration: BoxDecoration(
            color: kErrorLight,
            borderRadius: kRadiusMd,
            border: Border.all(color: const Color(0xFFFCA5A5)),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('⟳', style: TextStyle(fontSize: 20, color: Color(0xFFDC2626))),
              Text('Tap to retry', style: tsCaption.copyWith(color: const Color(0xFFDC2626))),
            ],
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _placeholder() => Container(
    width: double.infinity,
    height: 200,
    decoration: BoxDecoration(color: kBorder, borderRadius: kRadiusMd),
    child: const Icon(Icons.broken_image_outlined, color: Colors.white54, size: 40),
  );
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
    body: PhotoView(imageProvider: NetworkImage(imageUrl)),
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
  Widget build(BuildContext context) => Container(
    height: 72,
    padding: const EdgeInsets.symmetric(horizontal: s16),
    decoration: BoxDecoration(
      color: Colors.white,
      border: Border(top: BorderSide(color: kBorder)),
      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, -2))],
    ),
    child: Row(
      children: [
        // Prev
        OutlinedButton.icon(
          onPressed: stepIndex > 0 ? onPrev : null,
          icon: const Icon(Icons.arrow_back_ios, size: 14),
          label: const Text('Prev'),
          style: OutlinedButton.styleFrom(
            foregroundColor: kPrimary,
            side: BorderSide(color: stepIndex > 0 ? kPrimary : kBorder),
            padding: const EdgeInsets.symmetric(horizontal: s16, vertical: s10),
            shape: RoundedRectangleBorder(borderRadius: kRadiusMd),
          ),
        ),

        // Counter
        Expanded(
          child: Center(
            child: Text('${stepIndex + 1} / $total',
              style: tsSubhead.copyWith(color: kTextSub)),
          ),
        ),

        // Next
        FilledButton.icon(
          onPressed: stepIndex < total - 1 ? onNext : null,
          icon: const Text('Next'),
          label: const Icon(Icons.arrow_forward_ios, size: 14),
          style: FilledButton.styleFrom(
            backgroundColor: kPrimary,
            padding: const EdgeInsets.symmetric(horizontal: s16, vertical: s10),
            shape: RoundedRectangleBorder(borderRadius: kRadiusMd),
          ),
        ),
      ],
    ),
  );
}
