import 'package:flutter/material.dart';
import '../../app/theme.dart';

export '../../app/theme.dart';

// ── MxChip ────────────────────────────────────────────────────────────────────
class MxChip extends StatelessWidget {
  final String label;
  final Color? bg;
  final Color? border;
  final Color? textColor;
  const MxChip(this.label, {super.key, this.bg, this.border, this.textColor});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: s12, vertical: s4 + 2),
    decoration: BoxDecoration(
      color: bg ?? Colors.white,
      borderRadius: kRadiusFull,
      border: Border.all(color: border ?? kBorder),
    ),
    child: Text(label, style: tsCaption.copyWith(color: textColor ?? kText, fontWeight: FontWeight.w600)),
  );
}

// ── MxSectionHeader ────────────────────────────────────────────────────────────
class MxSectionHeader extends StatelessWidget {
  final String label;
  const MxSectionHeader(this.label, {super.key});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: s8),
    child: Text(label.toUpperCase(), style: tsLabel),
  );
}

// ── MxCollapsibleCard ─────────────────────────────────────────────────────────
class MxCollapsibleCard extends StatefulWidget {
  final Widget header;
  final Widget child;
  final bool initiallyExpanded;
  final Color? borderColor;
  final Color? bgColor;

  const MxCollapsibleCard({
    super.key,
    required this.header,
    required this.child,
    this.initiallyExpanded = false,
    this.borderColor,
    this.bgColor,
  });

  @override
  State<MxCollapsibleCard> createState() => _MxCollapsibleCardState();
}

class _MxCollapsibleCardState extends State<MxCollapsibleCard> {
  late bool _expanded;

  @override
  void initState() {
    super.initState();
    _expanded = widget.initiallyExpanded;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: widget.bgColor ?? Colors.white,
        borderRadius: kRadiusLg,
        border: Border.all(color: widget.borderColor ?? kBorder),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: s16, vertical: s12),
              child: Row(
                children: [
                  Expanded(child: widget.header),
                  Icon(_expanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                      size: 18, color: kTextMuted),
                ],
              ),
            ),
          ),
          if (_expanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(s16, 0, s16, s16),
              child: widget.child,
            ),
        ],
      ),
    );
  }
}

// ── MxDifficultyBadge ─────────────────────────────────────────────────────────
Color _diffColor(String d) => switch (d.toUpperCase()) {
  'BEGINNER'     => kSuccess,
  'INTERMEDIATE' => kWarning,
  _              => const Color(0xFFDC2626),
};

class MxDifficultyDot extends StatelessWidget {
  final String difficulty;
  const MxDifficultyDot(this.difficulty, {super.key});

  @override
  Widget build(BuildContext context) => Container(
    width: 8, height: 8,
    decoration: BoxDecoration(color: _diffColor(difficulty), shape: BoxShape.circle),
  );
}

// ── MxSkeleton ────────────────────────────────────────────────────────────────
class MxSkeleton extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;
  const MxSkeleton({super.key, required this.width, required this.height, this.borderRadius});

  @override
  State<MxSkeleton> createState() => _MxSkeletonState();
}

class _MxSkeletonState extends State<MxSkeleton> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _anim = Tween(begin: 0.3, end: 0.7).animate(_ctrl);
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: _anim,
    child: Container(
      width: widget.width, height: widget.height,
      decoration: BoxDecoration(
        color: kBorder,
        borderRadius: widget.borderRadius ?? kRadiusMd,
      ),
    ),
  );
}

// ── MxErrorView ───────────────────────────────────────────────────────────────
class MxErrorView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  const MxErrorView({super.key, required this.message, this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(s24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('⚠️', style: TextStyle(fontSize: 36)),
          const SizedBox(height: s16),
          Text(message, style: tsBody, textAlign: TextAlign.center),
          if (onRetry != null) ...[
            const SizedBox(height: s16),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ],
      ),
    ),
  );
}

// ── MxEmptyState ──────────────────────────────────────────────────────────────
class MxEmptyState extends StatelessWidget {
  final String icon;
  final String title;
  final String? subtitle;
  const MxEmptyState({super.key, required this.icon, required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(s24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(icon, style: const TextStyle(fontSize: 40)),
          const SizedBox(height: s16),
          Text(title, style: tsSubhead),
          if (subtitle != null) ...[
            const SizedBox(height: s8),
            Text(subtitle!, style: tsBody, textAlign: TextAlign.center),
          ],
        ],
      ),
    ),
  );
}

// ── MxMetaChip ────────────────────────────────────────────────────────────────
class MxMetaChip extends StatelessWidget {
  final String label;
  const MxMetaChip(this.label, {super.key});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: s8, vertical: s4),
    decoration: BoxDecoration(
      color: kBg,
      borderRadius: kRadiusFull,
      border: Border.all(color: kBorder),
    ),
    child: Text(label, style: tsCaption.copyWith(color: kTextSub)),
  );
}
