import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../guides_provider.dart';
import '../../auth/auth_provider.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/mx_widgets.dart';
import '../../../app/theme.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

const _kKnownVehicles = [
  'Toyota Land Cruiser 200',
  'Nissan Qashqai J10',
  'BMW E90 3-Series',
  'Ford F-150',
  'Honda Civic',
  'Toyota Corolla',
  'Volkswagen Golf',
  'Mercedes C-Class',
  'Mercedes E-Class',
  'BMW 5 Series',
  'Audi A4',
  'Audi Q5',
  'Nissan Patrol',
  'Toyota Hilux',
  'Mitsubishi L200',
  'CAT 320D',
  'Komatsu PC200',
  'Volvo XC90',
  'Range Rover Sport',
  'Hyundai Tucson',
];

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  final _partCtrl = TextEditingController();
  String? _selectedVehicle; // null = not selected, 'other' = blocked
  bool _creating = false;

  bool get _canSubmit =>
      _selectedVehicle != null &&
      _selectedVehicle != 'other' &&
      _partCtrl.text.trim().isNotEmpty &&
      !_creating;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(guidesProvider.notifier).load());
    _partCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _partCtrl.dispose();
    super.dispose();
  }

  Future<void> _createGuide() async {
    final vehicle = _selectedVehicle;
    final part = _partCtrl.text.trim();
    if (vehicle == null || vehicle == 'other' || part.isEmpty) return;
    setState(() => _creating = true);
    _partCtrl.clear();
    FocusScope.of(context).unfocus();
    final guide = await ref.read(guidesProvider.notifier).create(vehicle, part);
    setState(() {
      _creating = false;
      _selectedVehicle = null;
    });
    if (!mounted) return;
    if (guide != null) context.push('/guides/${guide.id}');
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(guidesProvider);
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: Column(
          children: [
            // ── Top bar ──
            _TopBar(
              email: authState.tokens?.user.email ?? '',
              onProfile: () => context.push('/profile'),
            ),

            // ── New guide input ──
            _NewGuideBar(
              partController: _partCtrl,
              selectedVehicle: _selectedVehicle,
              onVehicleChanged: (v) => setState(() => _selectedVehicle = v),
              canSubmit: _canSubmit,
              isLoading: _creating,
              onSubmit: _createGuide,
            ),

            // ── Guides list ──
            Expanded(
              child: _buildBody(state),
            ),
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

class _NewGuideBar extends StatelessWidget {
  final TextEditingController partController;
  final String? selectedVehicle;
  final ValueChanged<String?> onVehicleChanged;
  final bool canSubmit;
  final bool isLoading;
  final VoidCallback onSubmit;

  const _NewGuideBar({
    required this.partController,
    required this.selectedVehicle,
    required this.onVehicleChanged,
    required this.canSubmit,
    required this.isLoading,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    final isOther = selectedVehicle == 'other';
    return Container(
      padding: const EdgeInsets.fromLTRB(s16, s12, s16, s12),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Vehicle model dropdown ──
          Container(
            decoration: BoxDecoration(
              color: kBg,
              borderRadius: kRadiusMd,
              border: Border.all(color: kBorder),
            ),
            padding: const EdgeInsets.symmetric(horizontal: s12),
            child: DropdownButton<String>(
              value: selectedVehicle,
              hint: const Text('Select vehicle model…', style: TextStyle(fontSize: 14, color: kTextMuted)),
              isExpanded: true,
              underline: const SizedBox.shrink(),
              style: const TextStyle(fontSize: 14, color: Colors.black87),
              items: [
                ..._kKnownVehicles.map((m) => DropdownMenuItem(value: m, child: Text(m))),
                const DropdownMenuItem(value: 'other', child: Text('Other')),
              ],
              onChanged: onVehicleChanged,
            ),
          ),

          // ── "Other" error ──
          if (isOther) ...[
            const SizedBox(height: s8),
            Container(
              padding: const EdgeInsets.all(s12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: kRadiusMd,
                border: Border.all(color: const Color(0xFFFCA5A5)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.error_outline, size: 16, color: Color(0xFFDC2626)),
                  SizedBox(width: s8),
                  Expanded(
                    child: Text(
                      'Sorry, this vehicle model does not exist. A guide cannot be generated.',
                      style: TextStyle(fontSize: 13, color: Color(0xFFDC2626)),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: s8),

          // ── Part name + submit ──
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: partController,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) { if (canSubmit) onSubmit(); },
                  decoration: InputDecoration(
                    hintText: 'Part name, e.g. Brake pads',
                    hintStyle: const TextStyle(color: kTextMuted, fontSize: 14),
                    contentPadding: const EdgeInsets.symmetric(horizontal: s12, vertical: s10),
                    filled: true,
                    fillColor: kBg,
                    border: OutlineInputBorder(borderRadius: kRadiusMd, borderSide: BorderSide(color: kBorder)),
                    enabledBorder: OutlineInputBorder(borderRadius: kRadiusMd, borderSide: BorderSide(color: kBorder)),
                    focusedBorder: OutlineInputBorder(borderRadius: kRadiusMd, borderSide: BorderSide(color: kPrimary, width: 2)),
                  ),
                ),
              ),
              const SizedBox(width: s8),
              FilledButton(
                onPressed: canSubmit ? onSubmit : null,
                style: FilledButton.styleFrom(
                  backgroundColor: kPrimary,
                  minimumSize: const Size(52, 48),
                  padding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(borderRadius: kRadiusMd),
                ),
                child: isLoading
                    ? const SizedBox(width: 20, height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.arrow_forward, color: Colors.white),
              ),
            ],
          ),
        ],
      ),
    );
  }
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
