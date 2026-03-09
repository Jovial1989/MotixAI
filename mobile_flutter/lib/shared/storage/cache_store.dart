import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

const _kCacheKey  = 'motix_guide_cache';
const _kRoleKey   = 'motix_user_role';
const _kMaxCached = 10;

class CacheStore {
  // ── Guide cache ─────────────────────────────────────────────────────────────

  Future<void> saveGuide(RepairGuide guide) async {
    final prefs = await SharedPreferences.getInstance();
    final guides = await _loadCachedGuides(prefs);
    guides.removeWhere((g) => g['id'] == guide.id);
    guides.insert(0, guide.toJson());
    if (guides.length > _kMaxCached) guides.removeRange(_kMaxCached, guides.length);
    await prefs.setString(_kCacheKey, jsonEncode(guides));
  }

  Future<List<RepairGuide>> loadGuides() async {
    final prefs = await SharedPreferences.getInstance();
    return (await _loadCachedGuides(prefs))
        .map((j) => RepairGuide.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<RepairGuide?> loadGuide(String id) async {
    final guides = await loadGuides();
    try { return guides.firstWhere((g) => g.id == id); }
    catch (_) { return null; }
  }

  Future<void> clearGuides() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kCacheKey);
  }

  Future<List<dynamic>> _loadCachedGuides(SharedPreferences prefs) async {
    final raw = prefs.getString(_kCacheKey);
    if (raw == null) return [];
    try { return jsonDecode(raw) as List<dynamic>; }
    catch (_) { return []; }
  }

  // ── Role ────────────────────────────────────────────────────────────────────

  Future<void> saveRole(String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kRoleKey, role);
  }

  Future<String?> loadRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kRoleKey);
  }

  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kCacheKey);
    await prefs.remove(_kRoleKey);
  }
}
