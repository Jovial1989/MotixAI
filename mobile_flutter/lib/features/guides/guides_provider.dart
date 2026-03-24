import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/api/api_client.dart';
import '../../shared/api/providers.dart';
import '../../shared/models/models.dart';
import '../../shared/storage/cache_store.dart';

// ── List state ─────────────────────────────────────────────────────────────────

class GuidesState {
  final List<RepairGuide> guides;
  final bool isLoading;
  final String? error;

  const GuidesState(
      {this.guides = const [], this.isLoading = false, this.error});

  GuidesState copyWith(
          {List<RepairGuide>? guides,
          bool? isLoading,
          String? error,
          bool clearError = false}) =>
      GuidesState(
        guides: guides ?? this.guides,
        isLoading: isLoading ?? this.isLoading,
        error: clearError ? null : (error ?? this.error),
      );
}

class GuidesNotifier extends StateNotifier<GuidesState> {
  final ApiClient _api;
  final CacheStore _cache;
  bool _isGuest = false;
  String? _language;

  GuidesNotifier(this._api, this._cache) : super(const GuidesState());

  Future<void> load({bool isGuest = false, String? language}) async {
    _isGuest = isGuest;
    _language = language;
    state = state.copyWith(isLoading: true, clearError: true);
    if (!isGuest) {
      final cached = await _cache.loadGuides();
      if (cached.isNotEmpty) {
        state = state.copyWith(guides: cached, isLoading: false);
      }
    }
    try {
      final fresh = isGuest
          ? await _api.getDemoGuides(language: language)
          : await _api.listGuides(language: language);
      if (!isGuest) {
        for (final g in fresh) {
          await _cache.saveGuide(g);
        }
      }
      state = state.copyWith(guides: fresh, isLoading: false);
    } catch (e) {
      if (state.guides.isEmpty) {
        state = state.copyWith(isLoading: false, error: e.toString());
      } else {
        state = state.copyWith(isLoading: false);
      }
    }
  }

  Future<void> refresh() => load(isGuest: _isGuest, language: _language);

  Future<RepairGuide?> create(
    String vehicleModel,
    String partName, {
    String? oemNumber,
    String? language,
  }) async {
    try {
      final guide = await _api.createGuide(
        vehicleModel: vehicleModel,
        partName: partName,
        oemNumber: oemNumber,
        language: language,
      );
      await _cache.saveGuide(guide);
      state = state.copyWith(guides: [guide, ...state.guides]);
      return guide;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  Future<void> delete(String id) async {
    try {
      await _api.deleteGuide(id);
      final updated = state.guides.where((g) => g.id != id).toList();
      state = state.copyWith(guides: updated);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void clearError() => state = state.copyWith(clearError: true);
}

final guidesProvider =
    StateNotifierProvider<GuidesNotifier, GuidesState>((ref) {
  return GuidesNotifier(
    ref.read(apiClientProvider),
    ref.read(cacheStoreProvider),
  );
});

// ── Single guide state ─────────────────────────────────────────────────────────

class GuideDetailState {
  final RepairGuide? guide;
  final bool isLoading;
  final String? error;
  final int stepIndex;

  const GuideDetailState({
    this.guide,
    this.isLoading = false,
    this.error,
    this.stepIndex = 0,
  });

  GuideDetailState copyWith(
          {RepairGuide? guide,
          bool? isLoading,
          String? error,
          int? stepIndex,
          bool clearError = false}) =>
      GuideDetailState(
        guide: guide ?? this.guide,
        isLoading: isLoading ?? this.isLoading,
        error: clearError ? null : (error ?? this.error),
        stepIndex: stepIndex ?? this.stepIndex,
      );
}

class GuideDetailNotifier extends StateNotifier<GuideDetailState> {
  final ApiClient _api;
  final CacheStore _cache;
  final String guideId;
  bool _alive = true;
  bool _isGuest = false;
  String? _language;

  GuideDetailNotifier(this._api, this._cache, this.guideId)
      : super(const GuideDetailState());

  @override
  void dispose() {
    _alive = false;
    super.dispose();
  }

  Future<void> load({bool isGuest = false, String? language}) async {
    _isGuest = isGuest;
    _language = language;
    state = state.copyWith(isLoading: true, clearError: true);
    if (!isGuest) {
      final cached = await _cache.loadGuide(guideId);
      if (cached != null) {
        state = state.copyWith(guide: cached, isLoading: false);
      }
    }
    try {
      final fresh = await _api.getGuide(guideId, language: language);
      if (!isGuest) {
        await _cache.saveGuide(fresh);
      }
      state = state.copyWith(guide: fresh, isLoading: false);
      if (!isGuest) {
        await _triggerImages(fresh);
      }
    } catch (e) {
      if (state.guide == null) {
        state = state.copyWith(isLoading: false, error: e.toString());
      } else {
        state = state.copyWith(isLoading: false);
      }
    }
  }

  Future<void> _triggerImages(RepairGuide g) async {
    // Trigger none, failed, AND stuck pending steps (queued/generating etc.).
    // For pending steps the backend's 5-minute stale check decides whether to restart;
    // if still active it returns the current status harmlessly.
    final toTrigger = g.steps
        .where((s) =>
            s.imageStatus == ImageStatus.none ||
            s.imageStatus == ImageStatus.failed ||
            s.isPending)
        .toList();
    if (toTrigger.isEmpty) return;

    await Future.wait(toTrigger.map((s) async {
      try {
        // Force only for failed steps (retry). None and pending use force=false
        // so the backend stale-check decides whether to restart an in-progress step.
        final result = await _api.generateStepImage(s.id,
            force: s.imageStatus == ImageStatus.failed);
        if (!_alive) return;
        // Apply the response immediately — avoids a round-trip getGuide for the happy path.
        final newStatus =
            _imageStatusFromString(result['imageStatus'] as String?);
        final newUrl = result['imageUrl'] as String?;
        final current = state.guide;
        if (current != null) {
          state = state.copyWith(
            guide: current.withUpdatedStep(
              s.copyWith(imageStatus: newStatus, imageUrl: newUrl),
            ),
          );
        }
      } catch (_) {}
    }));

    // Full refresh to pick up any steps that timed out and finished asynchronously.
    try {
      if (!_alive) return;
      final updated = await _api.getGuide(guideId, language: _language);
      await _cache.saveGuide(updated);
      state = state.copyWith(guide: updated);
      if (updated.hasInProgress) _startPolling();
    } catch (_) {}
  }

  /// Parses the imageStatus string returned by the generate-image endpoint.
  ImageStatus _imageStatusFromString(String? s) => switch (s) {
        'queued' => ImageStatus.queued,
        'searching_refs' => ImageStatus.searchingRefs,
        'analyzing_refs' => ImageStatus.analyzingRefs,
        'generating' => ImageStatus.generating,
        'ready' => ImageStatus.ready,
        'failed' => ImageStatus.failed,
        _ => ImageStatus.none,
      };

  Future<void> retryStepImage(String stepId) async {
    if (_isGuest) return;
    try {
      await _api.generateStepImage(stepId, force: true);
      final updated = await _api.getGuide(guideId, language: _language);
      await _cache.saveGuide(updated);
      state = state.copyWith(guide: updated);
      if (updated.hasInProgress) _startPolling();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> _startPolling() async {
    while (_alive && state.guide != null && state.guide!.hasInProgress) {
      await Future.delayed(const Duration(seconds: 4));
      if (!_alive) return;
      try {
        final updated = await _api.getGuide(guideId, language: _language);
        await _cache.saveGuide(updated);
        state = state.copyWith(guide: updated);
      } catch (_) {}
    }
  }

  void setStep(int index) {
    final count = state.guide?.steps.length ?? 0;
    if (index < 0 || index >= count) return;
    state = state.copyWith(stepIndex: index);
  }

  void nextStep() => setStep(state.stepIndex + 1);
  void prevStep() => setStep(state.stepIndex - 1);
}

// Family provider keyed by guide ID
final guideDetailProvider =
    StateNotifierProvider.family<GuideDetailNotifier, GuideDetailState, String>(
        (ref, id) {
  return GuideDetailNotifier(
    ref.read(apiClientProvider),
    ref.read(cacheStoreProvider),
    id,
  );
});
