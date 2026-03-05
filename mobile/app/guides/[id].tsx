import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Image, Pressable,
  SafeAreaView, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { RepairGuide, RepairStep } from '@motixai/shared';
import { authApi } from '@/lib/api';
import { C, T, S, R, SHADOW, SCREEN_H_PAD } from '@/theme';

const POLL_INTERVAL_MS = 4000;

function hasInProgress(steps: RepairStep[]) {
  return steps.some((s) => s.imageStatus === 'queued' || s.imageStatus === 'generating');
}

// ─── Step image ───────────────────────────────────────────────────────────────
function StepImage({ step, onRetry }: { step: RepairStep; onRetry: () => void }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (step.imageStatus !== 'queued' && step.imageStatus !== 'generating') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [step.imageStatus, pulse]);

  if (step.imageStatus === 'ready' && step.imageUrl) {
    return (
      <Image
        source={{ uri: step.imageUrl }}
        style={img.image}
        resizeMode="cover"
      />
    );
  }

  if (step.imageStatus === 'queued' || step.imageStatus === 'generating') {
    return (
      <Animated.View style={[img.skeleton, { opacity: pulse }]}>
        <View style={img.skeletonInner}>
          <ActivityIndicator color={C.primary} size="small" />
          <Text style={img.skeletonText}>Generating illustration…</Text>
        </View>
      </Animated.View>
    );
  }

  if (step.imageStatus === 'failed') {
    return (
      <Pressable style={img.failBox} onPress={onRetry}>
        <Text style={img.failIcon}>⟳</Text>
        <Text style={img.failText}>Tap to retry</Text>
      </Pressable>
    );
  }

  return null;
}

const img = StyleSheet.create({
  image:       { width: '100%', height: 220, borderRadius: R.md, marginTop: S.sm },
  skeleton:    { width: '100%', height: 140, borderRadius: R.md, backgroundColor: C.bg, marginTop: S.sm, overflow: 'hidden' },
  skeletonInner:{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: S.xs },
  skeletonText:{ ...T.caption, color: C.textMuted, fontWeight: '400', textTransform: undefined, letterSpacing: 0 },
  failBox:     { width: '100%', height: 72, borderRadius: R.md, borderWidth: 1.5, borderColor: C.errorBorder, backgroundColor: C.errorLight, justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: S.sm },
  failIcon:    { fontSize: 18, color: C.error },
  failText:    { ...T.caption, color: C.error, fontWeight: '500', textTransform: undefined, letterSpacing: 0 },
});

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({ step, onRetry }: { step: RepairStep; onRetry: () => void }) {
  return (
    <View style={sc.card}>
      {/* Step number pill + title */}
      <View style={sc.titleRow}>
        <View style={sc.pill}>
          <Text style={sc.pillText}>{step.stepOrder}</Text>
        </View>
        <Text style={sc.title} numberOfLines={2}>{step.title}</Text>
      </View>

      {/* Illustration */}
      <StepImage step={step} onRetry={onRetry} />

      {/* Instruction */}
      <Text style={sc.instruction}>{step.instruction}</Text>

      {/* Specs row */}
      {(step.torqueValue || step.warningNote) && (
        <View style={sc.specRow}>
          {step.torqueValue && (
            <View style={sc.specChip}>
              <Text style={sc.specIcon}>🔩</Text>
              <Text style={sc.specLabel}>Torque</Text>
              <Text style={sc.specValue}>{step.torqueValue}</Text>
            </View>
          )}
          {step.warningNote && (
            <View style={[sc.specChip, sc.warnChip]}>
              <Text style={sc.specIcon}>⚠️</Text>
              <Text style={[sc.specLabel, sc.warnText]}>{step.warningNote}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const sc = StyleSheet.create({
  card:        { backgroundColor: C.bgCard, borderRadius: R.lg, padding: S.md, marginBottom: S.sm, ...SHADOW.xs, borderWidth: 1, borderColor: C.border },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  pill:        { width: 32, height: 32, borderRadius: R.full, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pillText:    { fontSize: 13, fontWeight: '800', color: '#fff' },
  title:       { ...T.subhead, flex: 1 },
  instruction: { ...T.body, marginTop: S.xs },
  specRow:     { gap: S.xs, marginTop: S.xs },
  specChip:    { flexDirection: 'row', alignItems: 'center', gap: S.xs, backgroundColor: C.successLight, borderRadius: R.sm, padding: S.sm, borderWidth: 1, borderColor: C.successBorder },
  warnChip:    { backgroundColor: C.warningLight, borderColor: C.warningBorder },
  specIcon:    { fontSize: 14 },
  specLabel:   { ...T.caption, color: C.success, fontWeight: '600', textTransform: undefined, letterSpacing: 0 },
  specValue:   { ...T.smallBold, color: C.success },
  warnText:    { color: C.warning, flex: 1 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function GuideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [guide, setGuide] = useState<RepairGuide | null>(null);
  const [error, setError] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null; }
  }, []);

  const fetchGuide = useCallback(async (): Promise<RepairGuide | null> => {
    try {
      const api = await authApi();
      return await api.getGuide(id!);
    } catch { return null; }
  }, [id]);

  const triggerImages = useCallback(async (g: RepairGuide) => {
    const noneSteps = g.steps.filter((s) => s.imageStatus === 'none');
    if (noneSteps.length === 0) return;
    const api = await authApi();
    await Promise.allSettled(noneSteps.map((s) => api.generateStepImage(s.id)));
  }, []);

  const retryStep = useCallback(async (stepId: string) => {
    const api = await authApi();
    await api.generateStepImage(stepId, true);
    const updated = await fetchGuide();
    if (updated) setGuide(updated);
  }, [fetchGuide]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const g = await fetchGuide();
      if (!g) { setError(true); return; }
      setGuide(g);
      await triggerImages(g);
      const triggered = await fetchGuide();
      if (triggered) setGuide(triggered);
      if (hasInProgress(triggered?.steps ?? g.steps)) {
        pollTimer.current = setInterval(async () => {
          const updated = await fetchGuide();
          if (!updated) return;
          setGuide(updated);
          if (!hasInProgress(updated.steps)) stopPolling();
        }, POLL_INTERVAL_MS);
      }
    })();
    return stopPolling;
  }, [id, fetchGuide, triggerImages, stopPolling]);

  // ── Error ──
  if (error) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centerState}>
          <Text style={s.errorIcon}>⚠️</Text>
          <Text style={s.errorTitle}>Couldn't load guide</Text>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>← Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ──
  if (!guide) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingText}>Loading guide…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const readyCount = guide.steps.filter((s) => s.imageStatus === 'ready').length;
  const allReady   = readyCount === guide.steps.length;

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Sticky header ── */}
      <View style={s.stickyHeader}>
        <Pressable style={s.backRow} onPress={() => router.back()} hitSlop={8}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backLabel}>Back</Text>
        </Pressable>
        <View style={s.progressPill}>
          {!allReady && <ActivityIndicator size="small" color={C.primary} style={{ marginRight: 4 }} />}
          <Text style={s.progressText}>
            {allReady ? `${guide.steps.length} steps ready` : `${readyCount}/${guide.steps.length} illustrations`}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Guide header ── */}
        <View style={s.guideHeader}>
          <View style={s.metaRow}>
            <View style={[s.metaBadge, { backgroundColor: C.primaryLight, borderColor: C.primaryBorder }]}>
              <Text style={[s.metaBadgeText, { color: C.primaryDark }]}>⏱ {guide.timeEstimate}</Text>
            </View>
            <View style={s.metaBadge}>
              <Text style={s.metaBadgeText}>📊 {guide.difficulty}</Text>
            </View>
            <View style={s.metaBadge}>
              <Text style={s.metaBadgeText}>{guide.vehicle.model}</Text>
            </View>
          </View>
          <Text style={s.guideTitle}>{guide.title}</Text>
          <Text style={s.guideSub}>{guide.part.name}</Text>
        </View>

        {/* ── Tools ── */}
        {guide.tools.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>TOOLS REQUIRED</Text>
            <View style={s.chipRow}>
              {guide.tools.map((tool, i) => (
                <View key={i} style={s.toolChip}>
                  <Text style={s.toolChipText}>{tool}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Safety ── */}
        {guide.safetyNotes.length > 0 && (
          <View style={s.safetyCard}>
            <Text style={s.safetyTitle}>⚠️  Safety notes</Text>
            {guide.safetyNotes.map((note, i) => (
              <View key={i} style={s.safetyRow}>
                <View style={s.safetydot} />
                <Text style={s.safetyNote}>{note}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Steps ── */}
        <Text style={s.stepsHeader}>PROCEDURE — {guide.steps.length} STEPS</Text>
        {guide.steps.map((step: RepairStep) => (
          <StepCard key={step.id} step={step} onRetry={() => void retryStep(step.id)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },

  // States
  centerState:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: S.md },
  errorIcon:    { fontSize: 36 },
  errorTitle:   { ...T.heading, color: C.textSub },
  backBtn:      { backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: S.lg, paddingVertical: S.sm + 2 },
  backBtnText:  { fontSize: 14, fontWeight: '700', color: '#fff' },
  loadingText:  { ...T.body, color: C.textMuted, marginTop: S.xs },

  // Sticky header
  stickyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SCREEN_H_PAD, paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bgCard, ...SHADOW.xs },
  backRow:      { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  backArrow:    { fontSize: 20, color: C.primary, fontWeight: '700' },
  backLabel:    { ...T.smallBold, color: C.primary },
  progressPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: S.xs, borderWidth: 1, borderColor: C.border },
  progressText: { ...T.caption, color: C.textSub, fontWeight: '500', textTransform: undefined, letterSpacing: 0 },

  // Guide header
  scroll:       { paddingHorizontal: SCREEN_H_PAD, paddingBottom: S.xl },
  guideHeader:  { paddingTop: S.lg, paddingBottom: S.md, gap: S.xs },
  metaRow:      { flexDirection: 'row', gap: S.xs, flexWrap: 'wrap', marginBottom: S.xs },
  metaBadge:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: S.xs, borderWidth: 1, borderColor: C.border },
  metaBadgeText:{ ...T.caption, color: C.textSub, fontWeight: '500', textTransform: undefined, letterSpacing: 0 },
  guideTitle:   { ...T.title, lineHeight: 32 },
  guideSub:     { ...T.body, color: C.textMuted },

  // Sections
  section:      { marginBottom: S.md },
  sectionTitle: { ...T.label, marginBottom: S.sm },
  chipRow:      { flexDirection: 'row', gap: S.xs, flexWrap: 'wrap' },
  toolChip:     { backgroundColor: C.bgCard, borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.xs + 2, borderWidth: 1, borderColor: C.border },
  toolChipText: { ...T.small, color: C.text, fontWeight: '500' },

  // Safety card
  safetyCard:   { backgroundColor: C.warningLight, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.warningBorder, marginBottom: S.md, gap: S.xs },
  safetyTitle:  { ...T.smallBold, color: C.warning },
  safetyRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  safetydot:    { width: 5, height: 5, borderRadius: 99, backgroundColor: C.warning, marginTop: 7, flexShrink: 0 },
  safetyNote:   { ...T.small, color: '#78350f', flex: 1, lineHeight: 20 },

  // Steps header
  stepsHeader:  { ...T.label, marginBottom: S.sm },
});
