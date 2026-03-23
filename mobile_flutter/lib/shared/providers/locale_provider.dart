import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _localeKey = 'motix_locale';
const _countryKey = 'motix_country';

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});

final hasChosenCountryProvider = StateProvider<bool>((ref) => false);

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('en')) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(_localeKey) ?? 'en';
    state = Locale(code);
  }

  Future<void> setLocale(String code) async {
    state = Locale(code);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localeKey, code);
  }

  Future<void> setCountry(String country) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_countryKey, country);

    final localeMap = {
      'global': 'en',
      'ukraine': 'uk',
      'bulgaria': 'bg',
    };
    final code = localeMap[country] ?? 'en';
    await setLocale(code);
  }

  static Future<bool> hasChosenCountry() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_countryKey) != null;
  }
}
