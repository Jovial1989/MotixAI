import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../shared/providers/locale_provider.dart';

class _CountryOption {
  final String key;
  final String flag;
  final String label;
  final String sub;

  const _CountryOption({
    required this.key,
    required this.flag,
    required this.label,
    required this.sub,
  });
}

const _countries = [
  _CountryOption(key: 'global', flag: '🌍', label: 'Global', sub: 'English'),
  _CountryOption(
      key: 'ukraine', flag: '🇺🇦', label: 'Україна', sub: 'Українська'),
  _CountryOption(
      key: 'bulgaria', flag: '🇧🇬', label: 'България', sub: 'Български'),
];

class CountrySelectScreen extends ConsumerStatefulWidget {
  /// Where to navigate after selection. Passed from the splash bootstrap.
  final String nextRoute;

  const CountrySelectScreen({super.key, required this.nextRoute});

  @override
  ConsumerState<CountrySelectScreen> createState() =>
      _CountrySelectScreenState();
}

class _CountrySelectScreenState extends ConsumerState<CountrySelectScreen> {
  String? _selected;

  Future<void> _confirm() async {
    if (_selected == null) return;
    await ref.read(localeProvider.notifier).setCountry(_selected!);
    ref.read(hasChosenCountryProvider.notifier).state = true;
    if (!mounted) return;
    context.go(widget.nextRoute);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: s24, vertical: s48),
          child: Column(
            children: [
              const Spacer(),
              // Logo
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: kPrimary,
                  borderRadius: kRadiusXl,
                ),
                child: const Center(
                  child: Text('M',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      )),
                ),
              ),
              const SizedBox(height: s24),
              const Text('Choose your region',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                    color: kText,
                  )),
              const SizedBox(height: s8),
              const Text(
                'Select your country to set the language.\nYou can change this later in settings.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15, color: kTextSub, height: 1.5),
              ),
              const SizedBox(height: s32),

              // Country cards
              ..._countries.map((c) {
                final isSelected = _selected == c.key;
                return Padding(
                  padding: const EdgeInsets.only(bottom: s12),
                  child: GestureDetector(
                    onTap: () => setState(() => _selected = c.key),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(
                          horizontal: s16, vertical: s16),
                      decoration: BoxDecoration(
                        color: kBgCard,
                        borderRadius: kRadiusMd,
                        border: Border.all(
                          color: isSelected ? kPrimary : kBorder,
                          width: isSelected ? 2 : 1.5,
                        ),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                    color: kPrimary.withValues(alpha: 0.08),
                                    blurRadius: 12)
                              ]
                            : null,
                      ),
                      child: Row(
                        children: [
                          Text(c.flag, style: const TextStyle(fontSize: 28)),
                          const SizedBox(width: s16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(c.label,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: kText,
                                    )),
                                const SizedBox(height: 2),
                                Text(c.sub,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: kTextSub,
                                    )),
                              ],
                            ),
                          ),
                          AnimatedOpacity(
                            duration: const Duration(milliseconds: 180),
                            opacity: isSelected ? 1 : 0,
                            child: Container(
                              width: 24,
                              height: 24,
                              decoration: const BoxDecoration(
                                color: kPrimary,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.check,
                                  size: 16, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),

              const Spacer(),

              // Continue button
              SizedBox(
                width: double.infinity,
                height: kBtnHeight,
                child: ElevatedButton(
                  onPressed: _selected != null ? _confirm : null,
                  child: const Text('Continue'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
