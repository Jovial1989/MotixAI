import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../app/theme.dart';

// ── Models ────────────────────────────────────────────────────────────────────

class GuideFormData {
  final String vehicleModel;
  final String partName;
  final String? vin;
  final String? oemNumber;
  const GuideFormData({
    required this.vehicleModel,
    required this.partName,
    this.vin,
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

// ── NHTSA helpers ─────────────────────────────────────────────────────────────

Future<Map<String, String>?> _decodeVin(String vin) async {
  try {
    final uri = Uri.parse(
      'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${Uri.encodeComponent(vin)}?format=json',
    );
    final res = await http.get(uri).timeout(const Duration(seconds: 10));
    if (res.statusCode != 200) return null;
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    final results = (json['Results'] as List?)?.first as Map<String, dynamic>?;
    if (results == null) return null;
    final errorCode = results['ErrorCode'] as String? ?? '';
    if (!errorCode.startsWith('0')) return null;
    return {
      'make': results['Make'] as String? ?? '',
      'model': results['Model'] as String? ?? '',
      'year': results['ModelYear'] as String? ?? '',
      'manufacturer': results['Manufacturer'] as String? ?? '',
    };
  } catch (_) {
    return null;
  }
}

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

  // Step 0
  bool _useVin = true;
  final _vinCtrl = TextEditingController();
  bool _vinDecoding = false;
  String? _vinError;
  Map<String, String>? _decodedVin;
  String? _selMake;
  String? _selModel;
  String? _selYear;
  List<String> _models = [];
  bool _loadingModels = false;

  // Step 1
  final _partCtrl = TextEditingController();
  final _oemCtrl = TextEditingController();
  List<String>? _disambig;

  @override
  void dispose() {
    _vinCtrl.dispose();
    _partCtrl.dispose();
    _oemCtrl.dispose();
    super.dispose();
  }

  String get _vehicleModel {
    if (_useVin && _decodedVin != null) {
      final d = _decodedVin!;
      return '${d['year']} ${d['make']} ${d['model']}'.trim();
    }
    return [_selYear, _selMake, _selModel].where((s) => s != null && s.isNotEmpty).join(' ');
  }

  bool get _step0Valid => _useVin ? _decodedVin != null : (_selMake != null && _selModel != null && _selYear != null);
  bool get _step1Valid => _partCtrl.text.trim().length >= 2;

  Future<void> _handleDecodeVin() async {
    final vin = _vinCtrl.text.trim().toUpperCase();
    if (vin.length < 11) {
      setState(() => _vinError = 'Enter at least 11 characters');
      return;
    }
    setState(() { _vinDecoding = true; _vinError = null; });
    final result = await _decodeVin(vin);
    setState(() {
      _vinDecoding = false;
      if (result == null) {
        _vinError = 'Could not decode VIN — check the number and try again';
      } else {
        _decodedVin = result;
      }
    });
  }

  Future<void> _handleMakeChanged(String? make) async {
    setState(() {
      _selMake = make;
      _selModel = null;
      _models = [];
      _loadingModels = make != null;
    });
    if (make == null) return;
    final models = await _fetchModels(make);
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
      vin: _useVin && _vinCtrl.text.isNotEmpty ? _vinCtrl.text.trim().toUpperCase() : null,
      oemNumber: _oemCtrl.text.trim().isNotEmpty ? _oemCtrl.text.trim() : null,
    ));
  }

  @override
  Widget build(BuildContext context) {
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
            // drag handle
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: kBorder, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            // step header
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
                  if (_step == 0) ..._buildStep0(),
                  if (_step == 1) ..._buildStep1(),
                  if (_step == 2) ..._buildStep2(),
                  const SizedBox(height: 24),
                  _buildNavButtons(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 0: Vehicle ───────────────────────────────────────────────────────

  List<Widget> _buildStep0() => [
    // Mode toggle
    Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kBorder),
      ),
      padding: const EdgeInsets.all(4),
      child: Row(children: [
        _ModeTab(label: 'VIN decode', active: _useVin, onTap: () => setState(() { _useVin = true; _decodedVin = null; _vinError = null; })),
        _ModeTab(label: 'Manual entry', active: !_useVin, onTap: () => setState(() { _useVin = false; })),
      ]),
    ),
    const SizedBox(height: 16),

    if (_useVin) ...[
      _Label('VIN number', required: true),
      const SizedBox(height: 6),
      Row(children: [
        Expanded(
          child: TextField(
            controller: _vinCtrl,
            textCapitalization: TextCapitalization.characters,
            maxLength: 17,
            onChanged: (_) => setState(() { _decodedVin = null; _vinError = null; }),
            decoration: _inputDec('e.g. 1HGBH41JXMN109186', counterText: ''),
          ),
        ),
        const SizedBox(width: 10),
        FilledButton(
          onPressed: _vinDecoding || _vinCtrl.text.trim().length < 11 ? null : _handleDecodeVin,
          style: FilledButton.styleFrom(
            backgroundColor: kPrimary,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          child: _vinDecoding
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Decode', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        ),
      ]),
      if (_vinError != null) ...[
        const SizedBox(height: 6),
        Text(_vinError!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13)),
      ],
      if (_decodedVin != null) ...[
        const SizedBox(height: 12),
        _DecodedCard(data: _decodedVin!, onClear: () => setState(() { _decodedVin = null; _vinCtrl.clear(); })),
      ],
    ] else ...[
      _Label('Make', required: true),
      const SizedBox(height: 6),
      _DropdownWrap(
        hint: 'Select make…',
        value: _selMake,
        items: _kPopularMakes.map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
        onChanged: (v) => _handleMakeChanged(v),
      ),
      const SizedBox(height: 12),
      _Label('Model', required: true),
      const SizedBox(height: 6),
      _DropdownWrap(
        hint: _loadingModels ? 'Loading…' : (_selMake == null ? 'Select make first' : 'Select model…'),
        value: _selModel,
        items: _models.map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
        onChanged: _selMake == null || _loadingModels ? null : (v) => setState(() => _selModel = v),
      ),
      const SizedBox(height: 12),
      _Label('Year', required: true),
      const SizedBox(height: 6),
      _DropdownWrap(
        hint: 'Select year…',
        value: _selYear,
        items: _kYears.map((y) => DropdownMenuItem(value: '$y', child: Text('$y'))).toList(),
        onChanged: (v) => setState(() => _selYear = v),
      ),
      const SizedBox(height: 12),
      _Label('VIN', required: false),
      const SizedBox(height: 6),
      TextField(
        controller: _vinCtrl,
        textCapitalization: TextCapitalization.characters,
        maxLength: 17,
        decoration: _inputDec('Optional — e.g. 1HGBH41JXMN109186', counterText: ''),
      ),
    ],
  ];

  // ── Step 1: Repair ────────────────────────────────────────────────────────

  List<Widget> _buildStep1() => [
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
          child: const Text('Edit', style: TextStyle(color: kPrimary, fontSize: 12, fontWeight: FontWeight.w700)),
        ),
      ]),
    ),
    const SizedBox(height: 16),
    _Label('Part / repair description', required: true),
    const SizedBox(height: 6),
    TextField(
      controller: _partCtrl,
      onChanged: _onPartChanged,
      autofocus: true,
      decoration: _inputDec('e.g. Hydraulic pump, brakes, oil change…'),
    ),
    if (_disambig != null && _disambig!.isNotEmpty) ...[
      const SizedBox(height: 12),
      const Text('Did you mean:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: kTextMuted, letterSpacing: 0.5)),
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
    _Label('OEM / part number', required: false),
    const SizedBox(height: 6),
    TextField(controller: _oemCtrl, decoration: _inputDec('e.g. 4633891')),
  ];

  // ── Step 2: Confirm ───────────────────────────────────────────────────────

  List<Widget> _buildStep2() => [
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(children: [
        _ConfirmRow(label: 'Vehicle', value: _vehicleModel),
        if (_useVin && _vinCtrl.text.isNotEmpty) ...[
          const Divider(height: 20),
          _ConfirmRow(label: 'VIN', value: _vinCtrl.text.trim().toUpperCase(), mono: true),
        ],
        const Divider(height: 20),
        _ConfirmRow(label: 'Repair', value: _partCtrl.text.trim()),
        if (_oemCtrl.text.isNotEmpty) ...[
          const Divider(height: 20),
          _ConfirmRow(label: 'Part No.', value: _oemCtrl.text.trim(), mono: true),
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
      child: const Row(children: [
        Icon(Icons.auto_awesome, size: 16, color: kPrimary),
        SizedBox(width: 8),
        Expanded(child: Text(
          'AI will generate a step-by-step repair guide with images for each step.',
          style: TextStyle(fontSize: 13, color: kPrimary, fontWeight: FontWeight.w500),
        )),
      ]),
    ),
  ];

  // ── Nav buttons ───────────────────────────────────────────────────────────

  Widget _buildNavButtons() {
    if (_step == 0) {
      return SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: _step0Valid ? () => setState(() => _step = 1) : null,
          style: _btnStyle(),
          child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('Continue', style: TextStyle(fontWeight: FontWeight.w700)),
            SizedBox(width: 6),
            Icon(Icons.arrow_forward, size: 16),
          ]),
        ),
      );
    }
    if (_step == 1) {
      return Row(children: [
        _BackBtn(onTap: () => setState(() => _step = 0)),
        const SizedBox(width: 10),
        Expanded(child: FilledButton(
          onPressed: _step1Valid ? () => setState(() => _step = 2) : null,
          style: _btnStyle(),
          child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('Review', style: TextStyle(fontWeight: FontWeight.w700)),
            SizedBox(width: 6),
            Icon(Icons.arrow_forward, size: 16),
          ]),
        )),
      ]);
    }
    // step 2
    return Row(children: [
      _BackBtn(onTap: () => setState(() => _step = 1)),
      const SizedBox(width: 10),
      Expanded(child: FilledButton(
        onPressed: _submit,
        style: _btnStyle(),
        child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.auto_awesome, size: 16),
          SizedBox(width: 6),
          Text('Generate Guide', style: TextStyle(fontWeight: FontWeight.w700)),
        ]),
      )),
    ]);
  }

  ButtonStyle _btnStyle() => FilledButton.styleFrom(
    backgroundColor: kPrimary,
    minimumSize: const Size(double.infinity, 50),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
  );

  InputDecoration _inputDec(String hint, {String? counterText}) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: kTextMuted, fontSize: 14),
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    filled: true,
    fillColor: const Color(0xFFF8FAFC),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: kBorder)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: kBorder)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: kPrimary, width: 2)),
    counterText: counterText,
  );
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

class _ModeTab extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _ModeTab({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) => Expanded(
    child: GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        height: 36,
        decoration: BoxDecoration(
          color: active ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: active ? [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4, offset: const Offset(0, 1))] : null,
        ),
        child: Center(child: Text(label,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
            color: active ? const Color(0xFF0F172A) : kTextMuted),
        )),
      ),
    ),
  );
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

class _DropdownWrap extends StatelessWidget {
  final String hint;
  final String? value;
  final List<DropdownMenuItem<String>> items;
  final ValueChanged<String?>? onChanged;
  const _DropdownWrap({required this.hint, this.value, required this.items, this.onChanged});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: const Color(0xFFF8FAFC),
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: kBorder),
    ),
    padding: const EdgeInsets.symmetric(horizontal: 14),
    child: DropdownButton<String>(
      value: value,
      hint: Text(hint, style: const TextStyle(color: kTextMuted, fontSize: 14)),
      isExpanded: true,
      underline: const SizedBox.shrink(),
      style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A)),
      items: items,
      onChanged: onChanged,
    ),
  );
}

class _DecodedCard extends StatelessWidget {
  final Map<String, String> data;
  final VoidCallback onClear;
  const _DecodedCard({required this.data, required this.onClear});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: const Color(0xFFF0FDF4),
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: const Color(0x4A16A34A)),
    ),
    child: Row(children: [
      const Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 20),
      const SizedBox(width: 10),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('${data['year']} ${data['make']} ${data['model']}',
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
        Text(data['manufacturer'] ?? '', style: const TextStyle(fontSize: 12, color: kTextMuted)),
      ])),
      GestureDetector(
        onTap: onClear,
        child: const Icon(Icons.close, size: 18, color: kTextMuted),
      ),
    ]),
  );
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
  final VoidCallback onTap;
  const _BackBtn({required this.onTap});

  @override
  Widget build(BuildContext context) => OutlinedButton(
    onPressed: onTap,
    style: OutlinedButton.styleFrom(
      minimumSize: const Size(90, 50),
      side: BorderSide(color: kBorder),
      foregroundColor: kTextMuted,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
    ),
    child: const Row(children: [
      Icon(Icons.arrow_back, size: 16),
      SizedBox(width: 4),
      Text('Back', style: TextStyle(fontWeight: FontWeight.w600)),
    ]),
  );
}
