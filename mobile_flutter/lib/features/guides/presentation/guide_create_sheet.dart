import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../app/theme.dart';
import '../../../l10n/generated/app_localizations.dart';

// ── Models ────────────────────────────────────────────────────────────────────

class GuideFormData {
  final String vehicleModel;
  final String partName;
  final String? oemNumber;
  const GuideFormData({
    required this.vehicleModel,
    required this.partName,
    this.oemNumber,
  });
}

// ── Disambiguation map ────────────────────────────────────────────────────────

const _kDisambig = <String, List<String>>{
  'brakes':   ['Brake pads replacement', 'Brake caliper rebuild', 'Brake rotor resurfacing', 'Brake fluid flush', 'ABS sensor replacement'],
  'brake':    ['Brake pads replacement', 'Brake caliper rebuild', 'Brake rotor resurfacing', 'Brake fluid flush'],
  'oil':      ['Engine oil & filter change', 'Transmission fluid change', 'Differential oil change', 'Power steering fluid flush'],
  'battery':  ['12V battery replacement', 'Battery terminal cleaning', 'Alternator replacement', 'Charging system diagnosis'],
  'suspension': ['Shock absorber replacement', 'Strut replacement', 'Control arm bushing replacement', 'Ball joint replacement', 'CV axle replacement'],
  'steering': ['Power steering fluid flush', 'Steering rack replacement', 'Tie rod end replacement', 'Wheel alignment', 'Power steering pump'],
  'ac':       ['AC compressor replacement', 'AC refrigerant recharge', 'Cabin air filter replacement', 'AC condenser replacement'],
  'air conditioning': ['AC compressor replacement', 'AC refrigerant recharge', 'Cabin air filter replacement'],
  'transmission': ['Transmission fluid service', 'Clutch kit replacement', 'Transmission mount replacement', 'Gearbox overhaul'],
  'engine':   ['Timing belt replacement', 'Spark plug replacement', 'Engine air filter replacement', 'Head gasket repair'],
  'noise':    ['Brake squeal diagnosis', 'Suspension rattle diagnosis', 'Engine knock diagnosis', 'Exhaust leak repair'],
  'cooling':  ['Radiator flush', 'Thermostat replacement', 'Water pump replacement', 'Coolant hose replacement'],
  'exhaust':  ['Exhaust manifold gasket', 'Catalytic converter replacement', 'Muffler replacement', 'Oxygen sensor replacement'],
  'fuel':     ['Fuel filter replacement', 'Fuel pump replacement', 'Fuel injector cleaning', 'Throttle body cleaning'],
  'electrical': ['Alternator replacement', 'Starter motor replacement', 'Fuse box diagnosis', 'Ground strap replacement'],
  'hydraulic': ['Hydraulic pump replacement', 'Hydraulic hose replacement', 'Hydraulic cylinder rebuild', 'Hydraulic fluid change'],
};

List<String>? _getDisambig(String text) {
  final lower = text.toLowerCase();
  for (final entry in _kDisambig.entries) {
    if (lower.contains(entry.key)) return entry.value;
  }
  return null;
}

// ── Popular makes ─────────────────────────────────────────────────────────────

const _kPopularMakes = [
  'Acura','Audi','BMW','BYD','Cadillac','Caterpillar','Chevrolet','Chrysler',
  'Dodge','Fiat','Ford','Genesis','GMC','Honda','Hyundai','Infiniti','Jaguar',
  'Jeep','John Deere','Kia','Komatsu','Land Rover','Lexus','Lincoln','Mack',
  'Mazda','Mercedes-Benz','Mitsubishi','Nissan','Peugeot','Porsche','Ram',
  'Range Rover','Renault','Scania','Subaru','Suzuki','Tesla','Toyota',
  'Volkswagen','Volvo',
];

List<int> get _kYears => List.generate(2026 - 1980 + 1, (i) => 2026 - i);

// ── NHTSA model lookup ────────────────────────────────────────────────────────

Future<List<String>> _fetchModels(String make) async {
  try {
    final uri = Uri.parse(
      'https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${Uri.encodeComponent(make)}?format=json',
    );
    final res = await http.get(uri).timeout(const Duration(seconds: 8));
    if (res.statusCode != 200) return [];
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    final results = (json['Results'] as List?) ?? [];
    final models = results
        .map((r) => (r as Map<String, dynamic>)['Model_Name'] as String? ?? '')
        .where((m) => m.isNotEmpty)
        .toList()
      ..sort();
    return models;
  } catch (_) {
    return [];
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

Future<GuideFormData?> showGuideCreateSheet(BuildContext context) {
  return showModalBottomSheet<GuideFormData>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _GuideCreateSheet(),
  );
}

// ── Sheet widget ──────────────────────────────────────────────────────────────

class _GuideCreateSheet extends StatefulWidget {
  const _GuideCreateSheet();

  @override
  State<_GuideCreateSheet> createState() => _GuideCreateSheetState();
}

class _GuideCreateSheetState extends State<_GuideCreateSheet> {
  int _step = 0; // 0 = vehicle, 1 = repair, 2 = confirm

  // Step 0 — vehicle
  String? _selMake;
  String? _selModel;
  String? _selYear;
  List<String> _models = [];
  bool _loadingModels = false;
  final _modelCtrl = TextEditingController();

  // Step 1 — repair
  final _partCtrl = TextEditingController();
  final _oemCtrl  = TextEditingController();
  List<String>? _disambig;

  @override
  void dispose() {
    _modelCtrl.dispose();
    _partCtrl.dispose();
    _oemCtrl.dispose();
    super.dispose();
  }

  String get _vehicleModel =>
      [_selYear, _selMake, _selModel].where((s) => s != null && s.isNotEmpty).join(' ');

  bool get _step0Valid => _selMake != null && _selModel != null && _selModel!.isNotEmpty;
  bool get _step1Valid => _partCtrl.text.trim().length >= 2;

  Future<void> _handleMakeChanged(String? make) async {
    setState(() {
      _selMake = make;
      _selModel = null;
      _models = [];
      _modelCtrl.clear();
      _loadingModels = make != null;
    });
    if (make == null) return;
    final models = await _fetchModels(make);
    if (!mounted) return;
    setState(() { _models = models; _loadingModels = false; });
  }

  void _onPartChanged(String text) {
    setState(() {
      _disambig = text.length >= 2 ? _getDisambig(text) : null;
    });
  }

  void _applyChip(String chip) {
    _partCtrl.text = chip;
    setState(() => _disambig = null);
  }

  void _submit() {
    Navigator.of(context).pop(GuideFormData(
      vehicleModel: _vehicleModel,
      partName: _partCtrl.text.trim(),
      oemNumber: _oemCtrl.text.trim().isNotEmpty ? _oemCtrl.text.trim() : null,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _StepHeader(step: _step),
            ),
            const SizedBox(height: 8),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                controller: scrollCtrl,
                padding: const EdgeInsets.all(20),
                children: [
                  if (_step == 0) ..._buildStep0(l),
                  if (_step == 1) ..._buildStep1(l),
                  if (_step == 2) ..._buildStep2(l),
                  const SizedBox(height: 24),
                  _buildNavButtons(l),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 0: Vehicle ───────────────────────────────────────────────────────

  List<Widget> _buildStep0(S l) => [
    _Label(l.make, required: true),
    const SizedBox(height: 6),
    _PickerField(
      hint: '${l.selectMake}…',
      value: _selMake,
      onTap: () async {
        final picked = await _showMxPicker<String>(
          context: context,
          title: l.selectMake,
          items: _kPopularMakes,
          label: (m) => m,
          selected: _selMake,
        );
        if (picked != null && picked != _selMake) _handleMakeChanged(picked);
      },
    ),
    const SizedBox(height: 14),

    _Label(l.model, required: true),
    const SizedBox(height: 6),
    if (_loadingModels)
      Container(
        height: 48,
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: kBorder),
        ),
        child: const Center(child: SizedBox(
          width: 18, height: 18,
          child: CircularProgressIndicator(strokeWidth: 2, color: kPrimary),
        )),
      )
    else if (_models.isNotEmpty)
      _PickerField(
        hint: '${l.selectModel}…',
        value: _selModel,
        onTap: () async {
          final picked = await _showMxPicker<String>(
            context: context,
            title: l.selectModel,
            items: _models,
            label: (m) => m,
            selected: _selModel,
          );
          if (picked != null) setState(() => _selModel = picked);
        },
      )
    else
      TextField(
        controller: _modelCtrl,
        onChanged: (v) => setState(() => _selModel = v.trim().isEmpty ? null : v.trim()),
        enabled: _selMake != null,
        decoration: _inputDec(_selMake == null ? l.selectMakeFirst : 'e.g. Qashqai, F-150…'),
      ),
    const SizedBox(height: 14),

    _Label(l.year, required: false),
    const SizedBox(height: 6),
    _PickerField(
      hint: '${l.anyYear} (${l.optional})',
      value: _selYear,
      onTap: () async {
        final years = [l.anyYear, ..._kYears.map((y) => '$y')];
        final picked = await _showMxPicker<String>(
          context: context,
          title: l.year,
          items: years,
          label: (y) => y,
          selected: _selYear ?? l.anyYear,
        );
        if (picked != null) {
          setState(() => _selYear = picked == l.anyYear ? null : picked);
        }
      },
    ),
  ];

  // ── Step 1: Repair ────────────────────────────────────────────────────────

  List<Widget> _buildStep1(S l) => [
    // vehicle pill
    Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: kBorder),
      ),
      child: Row(children: [
        const Icon(Icons.directions_car, size: 14, color: kTextMuted),
        const SizedBox(width: 6),
        Expanded(child: Text(_vehicleModel, style: const TextStyle(fontSize: 13, color: kTextMuted, fontWeight: FontWeight.w600))),
        GestureDetector(
          onTap: () => setState(() => _step = 0),
          child: Text(l.back, style: const TextStyle(color: kPrimary, fontSize: 12, fontWeight: FontWeight.w700)),
        ),
      ]),
    ),
    const SizedBox(height: 16),
    _Label(l.partRepairDesc, required: true),
    const SizedBox(height: 6),
    TextField(
      controller: _partCtrl,
      onChanged: _onPartChanged,
      autofocus: true,
      decoration: _inputDec('e.g. Hydraulic pump, brakes, oil change…'),
    ),
    if (_disambig != null && _disambig!.isNotEmpty) ...[
      const SizedBox(height: 12),
      Text('${l.didYouMean}:', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: kTextMuted, letterSpacing: 0.5)),
      const SizedBox(height: 8),
      Wrap(
        spacing: 6,
        runSpacing: 6,
        children: _disambig!.map((opt) => _Chip(
          label: opt,
          active: _partCtrl.text == opt,
          onTap: () => _applyChip(opt),
        )).toList(),
      ),
    ],
    const SizedBox(height: 16),
    _Label(l.oemPartNumber, required: false),
    const SizedBox(height: 6),
    TextField(controller: _oemCtrl, decoration: _inputDec('e.g. 4633891')),
  ];

  // ── Step 2: Confirm ───────────────────────────────────────────────────────

  List<Widget> _buildStep2(S l) => [
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(children: [
        _ConfirmRow(label: l.vehicle, value: _vehicleModel),
        const Divider(height: 20),
        _ConfirmRow(label: l.repair, value: _partCtrl.text.trim()),
        if (_oemCtrl.text.isNotEmpty) ...[
          const Divider(height: 20),
          _ConfirmRow(label: l.partNo, value: _oemCtrl.text.trim(), mono: true),
        ],
      ]),
    ),
    const SizedBox(height: 16),
    Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: kPrimary.withOpacity(0.06),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kPrimary.withOpacity(0.2)),
      ),
      child: Row(children: [
        const Icon(Icons.auto_awesome, size: 16, color: kPrimary),
        const SizedBox(width: 8),
        Expanded(child: Text(
          l.confirmGenDesc,
          style: const TextStyle(fontSize: 13, color: kPrimary, fontWeight: FontWeight.w500),
        )),
      ]),
    ),
  ];

  // ── Nav buttons ───────────────────────────────────────────────────────────

  Widget _buildNavButtons(S l) {
    if (_step == 0) {
      return SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: _step0Valid ? () => setState(() => _step = 1) : null,
          style: _btnStyle(),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(l.continueBtn, style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(width: 6),
            const Icon(Icons.arrow_forward, size: 16),
          ]),
        ),
      );
    }
    if (_step == 1) {
      return Row(children: [
        _BackBtn(label: l.back, onTap: () => setState(() => _step = 0)),
        const SizedBox(width: 10),
        Expanded(child: FilledButton(
          onPressed: _step1Valid ? () => setState(() => _step = 2) : null,
          style: _btnStyle(),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(l.review, style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(width: 6),
            const Icon(Icons.arrow_forward, size: 16),
          ]),
        )),
      ]);
    }
    // step 2
    return Row(children: [
      _BackBtn(label: l.back, onTap: () => setState(() => _step = 1)),
      const SizedBox(width: 10),
      Expanded(child: FilledButton(
        onPressed: _submit,
        style: _btnStyle(),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.auto_awesome, size: 16),
          const SizedBox(width: 6),
          Text(l.generateGuide, style: const TextStyle(fontWeight: FontWeight.w700)),
        ]),
      )),
    ]);
  }

  ButtonStyle _btnStyle() => FilledButton.styleFrom(
    backgroundColor: kPrimary,
    minimumSize: const Size(double.infinity, 50),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
  );

  InputDecoration _inputDec(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: kTextMuted, fontSize: 14),
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    filled: true,
    fillColor: const Color(0xFFF8FAFC),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: kBorder)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: kBorder)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kPrimary, width: 2)),
    disabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: kBorder.withOpacity(0.5))),
  );
}

// ── Picker bottom sheet ───────────────────────────────────────────────────────

Future<T?> _showMxPicker<T>({
  required BuildContext context,
  required String title,
  required List<T> items,
  required String Function(T) label,
  T? selected,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _MxPickerSheet<T>(
      title: title,
      items: items,
      label: label,
      selected: selected,
    ),
  );
}

class _MxPickerSheet<T> extends StatefulWidget {
  final String title;
  final List<T> items;
  final String Function(T) label;
  final T? selected;
  const _MxPickerSheet({
    required this.title,
    required this.items,
    required this.label,
    this.selected,
  });

  @override
  State<_MxPickerSheet<T>> createState() => _MxPickerSheetState<T>();
}

class _MxPickerSheetState<T> extends State<_MxPickerSheet<T>> {
  final _searchCtrl = TextEditingController();
  final _searchFocus = FocusNode();
  List<T> _filtered = [];

  @override
  void initState() {
    super.initState();
    _filtered = widget.items;
    _searchCtrl.addListener(_onSearch);
  }

  void _onSearch() {
    final q = _searchCtrl.text.toLowerCase();
    setState(() {
      _filtered = q.isEmpty
          ? widget.items
          : widget.items.where((i) => widget.label(i).toLowerCase().contains(q)).toList();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    final mq = MediaQuery.of(context);
    return Container(
      height: mq.size.height * 0.72,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag handle
          const SizedBox(height: 12),
          Container(
            width: 40, height: 4,
            decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(2)),
          ),
          const SizedBox(height: 14),
          // Title row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Expanded(child: Text(widget.title,
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                )),
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(),
                  child: Container(
                    width: 30, height: 30,
                    decoration: BoxDecoration(color: const Color(0xFFF1F5F9), shape: BoxShape.circle),
                    child: const Icon(Icons.close, size: 16, color: Color(0xFF64748B)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Search bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _searchCtrl,
              focusNode: _searchFocus,
              autofocus: false,
              decoration: InputDecoration(
                hintText: '${l.search}…',
                hintStyle: const TextStyle(color: kTextMuted, fontSize: 14),
                prefixIcon: const Icon(Icons.search, size: 18, color: kTextMuted),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: kBorder)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: kBorder)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kPrimary, width: 1.5)),
              ),
            ),
          ),
          const SizedBox(height: 8),
          const Divider(height: 1),
          // List
          Expanded(
            child: _filtered.isEmpty
                ? const Center(child: Text('No results', style: TextStyle(color: kTextMuted, fontSize: 14)))
                : ListView.builder(
                    itemCount: _filtered.length,
                    itemExtent: 52,
                    itemBuilder: (_, i) {
                      final item = _filtered[i];
                      final lbl = widget.label(item);
                      final isSelected = item == widget.selected;
                      return InkWell(
                        onTap: () => Navigator.of(context).pop(item),
                        child: Container(
                          color: isSelected ? kPrimary.withOpacity(0.06) : Colors.transparent,
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Row(
                            children: [
                              Expanded(child: Text(lbl,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                                  color: isSelected ? kPrimary : const Color(0xFF0F172A),
                                ),
                              )),
                              if (isSelected)
                                const Icon(Icons.check, size: 18, color: kPrimary),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          SizedBox(height: mq.padding.bottom),
        ],
      ),
    );
  }
}

// ── Picker field button (replaces DropdownWrap) ───────────────────────────────

class _PickerField extends StatelessWidget {
  final String hint;
  final String? value;
  final VoidCallback? onTap;
  const _PickerField({required this.hint, this.value, this.onTap});

  @override
  Widget build(BuildContext context) {
    final hasValue = value != null && value!.isNotEmpty;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        height: 48,
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: kBorder),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: Row(
          children: [
            Expanded(child: Text(
              hasValue ? value! : hint,
              style: TextStyle(
                fontSize: 14,
                color: hasValue ? const Color(0xFF0F172A) : kTextMuted,
                fontWeight: hasValue ? FontWeight.w500 : FontWeight.w400,
              ),
              overflow: TextOverflow.ellipsis,
            )),
            const Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 20,
              color: Color(0xFF94A3B8),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Small helper widgets ──────────────────────────────────────────────────────

class _StepHeader extends StatelessWidget {
  final int step;
  const _StepHeader({required this.step});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      for (int i = 0; i < 3; i++) ...[
        if (i > 0) Expanded(child: Container(height: 2, color: i <= step ? kPrimary : kBorder)),
        Container(
          width: 28, height: 28,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: i <= step ? kPrimary : kBorder,
          ),
          child: Center(child: Text('${i + 1}', style: TextStyle(
            color: i <= step ? Colors.white : kTextMuted,
            fontSize: 12, fontWeight: FontWeight.w700,
          ))),
        ),
      ],
    ]);
  }
}

class _Label extends StatelessWidget {
  final String text;
  final bool required;
  const _Label(this.text, {required this.required});

  @override
  Widget build(BuildContext context) => Row(children: [
    Text(text.toUpperCase(), style: const TextStyle(
      fontSize: 11, fontWeight: FontWeight.w700, color: kTextMuted, letterSpacing: 0.6,
    )),
    if (required) const Text(' *', style: TextStyle(color: Color(0xFFDC2626), fontSize: 12)),
  ]);
}


class _Chip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _Chip({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: active ? kPrimary.withOpacity(0.1) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: active ? kPrimary : kBorder),
      ),
      child: Text(label, style: TextStyle(
        fontSize: 13, fontWeight: FontWeight.w500,
        color: active ? kPrimary : const Color(0xFF0F172A),
      )),
    ),
  );
}

class _ConfirmRow extends StatelessWidget {
  final String label;
  final String value;
  final bool mono;
  const _ConfirmRow({required this.label, required this.value, this.mono = false});

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      SizedBox(width: 72, child: Text(label.toUpperCase(),
        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: kTextMuted, letterSpacing: 0.5))),
      const SizedBox(width: 10),
      Expanded(child: Text(value,
        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600,
          color: const Color(0xFF0F172A),
          fontFamily: mono ? 'monospace' : null),
      )),
    ],
  );
}

class _BackBtn extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _BackBtn({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => OutlinedButton(
    onPressed: onTap,
    style: OutlinedButton.styleFrom(
      minimumSize: const Size(90, 50),
      side: BorderSide(color: kBorder),
      foregroundColor: kTextMuted,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
    ),
    child: Row(children: [
      const Icon(Icons.arrow_back, size: 16),
      const SizedBox(width: 4),
      Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
    ]),
  );
}
