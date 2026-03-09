import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { RepairGuide, RepairStep } from '@motixai/shared';
import { authApi } from '@/lib/api';
import { StepCard } from '@/components/StepCard';
import { StepNavigator } from '@/components/StepNavigator';
import { CollapsibleCard } from '@/components/CollapsibleCard';
import { Chip } from '@/components/Chip';
import { C, T, S, R, SHADOW, SCREEN_H_PAD } from '@/theme';

const POLL_MS = 4000;

function hasInProgress(steps: RepairStep[]) {
  return steps.some((s) => s.imageStatus === 'queued' || s.imageStatus === 'generating');
}

// ─── Guide header ─────────────────────────────────────────────────────────────
function GuideHeader({
  guide, stepIndex, readyCount, allReady, onBack,
}: {
  guide: RepairGuide; stepIndex: number; readyCount: number;
  allReady: boolean; onBack: () => void;
}) {
  const progress = guide.steps.length > 0 ? (stepIndex + 1) / guide.steps.length : 0;
  return (
    <View style={gh.wrap}>
      <View style={gh.topRow}>
        <Pressable style={gh.backBtn} onPress={onBack} hitSlop={8}>
          <Text style={gh.backArrow}>←</Text>
          <Text style={gh.backLabel}>Back</Text>
        </Pressable>
        <View style={gh.meta}>
          <Text style={gh.vehicle} numberOfLines={1}>{guide.vehicle.model}</Text>
          <Text style={gh.part} numberOfLines={1}>{guide.part.name}</Text>
        </View>
        <View style={gh.right}>
          <View style={gh.timeBadge}>
            <Text style={gh.timeText}>⏱ {guide.timeEstimate}</Text>
          </View>
          {!allReady && (
            <Text style={gh.imgProgress}>{readyCount}/{guide.steps.length} imgs</Text>
          )}
        </View>
      </View>
      <Text style={gh.title} numberOfLines={2}>{guide.title}</Text>
      <View style={gh.progressTrack}>
        <View style={[gh.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>
    </View>
  );
}

const gh = StyleSheet.create({
  wrap:          { backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border, ...SHADOW.xs },
  topRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SCREEN_H_PAD, paddingTop: S.sm, paddingBottom: S.xs, gap: S.sm },
  backBtn:       { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  backArrow:     { fontSize: 20, color: C.primary, fontWeight: '700' },
  backLabel:     { ...T.smallBold, color: C.primary },
  meta:          { flex: 1 },
  vehicle:       { ...T.caption, color: C.textMuted, textTransform: undefined, letterSpacing: 0 },
  part:          { ...T.smallBold, color: C.text },
  right:         { alignItems: 'flex-end', gap: 2 },
  timeBadge:     { backgroundColor: C.primaryLight, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3, borderWidth: 1, borderColor: C.primaryBorder },
  timeText:      { ...T.caption, color: C.primaryDark, fontWeight: '600', textTransform: undefined, letterSpacing: 0 },
  imgProgress:   { ...T.caption, color: C.textMuted, textTransform: undefined, letterSpacing: 0 },
  title:         { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: C.text, paddingHorizontal: SCREEN_H_PAD, paddingBottom: S.sm, lineHeight: 28 },
  progressTrack: { height: 3, backgroundColor: C.border },
  progressFill:  { height: 3, backgroundColor: C.primary },
});

// ─── Step timeline (horizontal) ───────────────────────────────────────────────
function StepTimeline({ steps, activeIndex, onSelect }: {
  steps: RepairStep[]; activeIndex: number; onSelect: (i: number) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sl.row}>
      {steps.map((step, i) => {
        const active = i === activeIndex;
        const done   = i < activeIndex;
        return (
          <Pressable key={step.id} style={sl.item} onPress={() => onSelect(i)}>
            <View style={[sl.dot, active && sl.dotActive, done && sl.dotDone]}>
              {done
                ? <Text style={sl.check}>✓</Text>
                : <Text style={[sl.num, active && sl.numActive]}>{i + 1}</Text>
              }
            </View>
            <Text style={[sl.label, active && sl.labelActive]} numberOfLines={2}>{step.title}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const sl = StyleSheet.create({
  row:        { paddingHorizontal: SCREEN_H_PAD, paddingVertical: S.sm, gap: S.xs },
  item:       { alignItems: 'center', width: 72, gap: 4 },
  dot:        { width: 28, height: 28, borderRadius: R.full, borderWidth: 2, borderColor: C.border, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center' },
  dotActive:  { borderColor: C.primary, backgroundColor: C.primary },
  dotDone:    { borderColor: C.success, backgroundColor: C.success },
  check:      { fontSize: 12, color: '#fff', fontWeight: '700' },
  num:        { fontSize: 11, fontWeight: '700', color: C.textMuted },
  numActive:  { color: '#fff' },
  label:      { ...T.caption, textAlign: 'center', color: C.textMuted, textTransform: undefined, letterSpacing: 0 },
  labelActive:{ color: C.primary, fontWeight: '700' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function GuideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const [guide, setGuide]         = useState<RepairGuide | null>(null);
  const [error, setError]         = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

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
    const none = g.steps.filter((s) => s.imageStatus === 'none');
    if (!none.length) return;
    const api = await authApi();
    await Promise.allSettled(none.map((s) => api.generateStepImage(s.id)));
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
        }, POLL_MS);
      }
    })();
    return stopPolling;
  }, [id, fetchGuide, triggerImages, stopPolling]);

  const goToStep = useCallback((i: number) => {
    if (!guide) return;
    setStepIndex(Math.max(0, Math.min(i, guide.steps.length - 1)));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [guide]);

  if (error) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.stateIcon}>⚠️</Text>
          <Text style={s.stateTitle}>Couldn't load guide</Text>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>← Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!guide) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.stateTitle}>Loading guide…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const steps      = guide.steps;
  const step       = steps[stepIndex];
  const readyCount = steps.filter((s) => s.imageStatus === 'ready').length;
  const allReady   = readyCount === steps.length;

  return (
    <SafeAreaView style={s.safe}>
      {/* Sticky top header */}
      <GuideHeader
        guide={guide} stepIndex={stepIndex}
        readyCount={readyCount} allReady={allReady}
        onBack={() => router.back()}
      />

      {/* Horizontal step timeline */}
      {steps.length > 1 && (
        <View style={s.timelineWrap}>
          <StepTimeline steps={steps} activeIndex={stepIndex} onSelect={goToStep} />
        </View>
      )}

      {/* Scrollable body */}
      <ScrollView ref={scrollRef} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Safety notes collapsible */}
        {guide.safetyNotes.length > 0 && (
          <CollapsibleCard title="Safety notes" count={guide.safetyNotes.length} accent="warning">
            {guide.safetyNotes.map((note, i) => (
              <View key={i} style={s.safetyRow}>
                <View style={s.safetyDot} />
                <Text style={s.safetyNote}>{note}</Text>
              </View>
            ))}
          </CollapsibleCard>
        )}

        {/* Tools chip grid */}
        {guide.tools.length > 0 && (
          <CollapsibleCard title="Tools required" count={guide.tools.length}>
            <View style={s.chipGrid}>
              {guide.tools.map((tool, i) => <Chip key={i} label={tool} />)}
            </View>
          </CollapsibleCard>
        )}

        {/* Step section label */}
        <View style={s.stepHeader}>
          <Text style={s.stepLabel}>PROCEDURE — {steps.length} STEPS</Text>
          {!allReady && (
            <View style={s.imgPill}>
              <ActivityIndicator size="small" color={C.primary} style={{ marginRight: 4 }} />
              <Text style={s.imgPillText}>{readyCount}/{steps.length} illustrations</Text>
            </View>
          )}
        </View>

        {/* Active step card */}
        {step && (
          <StepCard step={step} onRetry={() => void retryStep(step.id)} />
        )}
      </ScrollView>

      {/* Sticky bottom nav */}
      {steps.length > 1 && (
        <StepNavigator
          stepIndex={stepIndex} total={steps.length}
          onPrev={() => goToStep(stepIndex - 1)}
          onNext={() => goToStep(stepIndex + 1)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', gap: S.md },
  stateIcon:     { fontSize: 36 },
  stateTitle:    { ...T.heading, color: C.textSub },
  backBtn:       { backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: S.lg, paddingVertical: S.sm + 2 },
  backBtnText:   { fontSize: 14, fontWeight: '700', color: '#fff' },
  timelineWrap:  { backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.border },
  scroll:        { paddingHorizontal: SCREEN_H_PAD, paddingTop: S.md, paddingBottom: S.xl, gap: S.md },
  safetyRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, marginBottom: S.xs },
  safetyDot:     { width: 5, height: 5, borderRadius: 99, backgroundColor: C.warning, marginTop: 7, flexShrink: 0 },
  safetyNote:    { ...T.small, color: '#78350f', flex: 1, lineHeight: 20 },
  chipGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs },
  stepHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepLabel:     { ...T.label },
  imgPill:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgCard, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3, borderWidth: 1, borderColor: C.border },
  imgPillText:   { ...T.caption, color: C.textSub, fontWeight: '500', textTransform: undefined, letterSpacing: 0 },
});
