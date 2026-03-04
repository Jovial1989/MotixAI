import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { RepairGuide, RepairStep } from '@motixai/shared';
import { authApi } from '@/lib/api';

const POLL_INTERVAL_MS = 4000;

function hasInProgressImages(steps: RepairStep[]): boolean {
  return steps.some((s) => s.imageStatus === 'queued' || s.imageStatus === 'generating');
}

function StepImage({ step, onRetry }: { step: RepairStep; onRetry: () => void }) {
  if (step.imageStatus === 'ready' && step.imageUrl) {
    return (
      <Image
        source={{ uri: step.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
    );
  }
  if (step.imageStatus === 'queued' || step.imageStatus === 'generating') {
    return (
      <View style={styles.imageSkeleton}>
        <ActivityIndicator color="#f97316" />
        <Text style={styles.skeletonText}>Generating illustration…</Text>
      </View>
    );
  }
  if (step.imageStatus === 'failed') {
    return (
      <Pressable style={styles.imageFailedBox} onPress={onRetry}>
        <Text style={styles.imageFailedText}>Image failed — tap to retry</Text>
      </Pressable>
    );
  }
  return null;
}

export default function GuideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [guide, setGuide] = useState<RepairGuide | null>(null);
  const [error, setError] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const fetchGuide = useCallback(async (): Promise<RepairGuide | null> => {
    try {
      const api = await authApi();
      return await api.getGuide(id!);
    } catch {
      return null;
    }
  }, [id]);

  // Trigger image generation for all steps that have none
  const triggerImages = useCallback(async (g: RepairGuide) => {
    const noneSteps = g.steps.filter((s) => s.imageStatus === 'none');
    if (noneSteps.length === 0) return;
    const api = await authApi();
    // Enqueue all in parallel — server caps concurrency at 2
    await Promise.allSettled(noneSteps.map((s) => api.generateStepImage(s.id)));
  }, []);

  const retryStep = useCallback(async (stepId: string) => {
    const api = await authApi();
    await api.generateStepImage(stepId, true);
    // Refresh guide to show queued state
    const updated = await fetchGuide();
    if (updated) setGuide(updated);
  }, [fetchGuide]);

  useEffect(() => {
    if (!id) return;

    void (async () => {
      const g = await fetchGuide();
      if (!g) { setError(true); return; }
      setGuide(g);

      // Auto-trigger generation for steps that haven't started
      await triggerImages(g);

      // Refresh once after triggering so skeletons appear
      const triggered = await fetchGuide();
      if (triggered) setGuide(triggered);

      // Poll while any step is in progress
      if (hasInProgressImages(triggered?.steps ?? g.steps)) {
        pollTimer.current = setInterval(async () => {
          const updated = await fetchGuide();
          if (!updated) return;
          setGuide(updated);
          if (!hasInProgressImages(updated.steps)) stopPolling();
        }, POLL_INTERVAL_MS);
      }
    })();

    return stopPolling;
  }, [id, fetchGuide, triggerImages, stopPolling]);

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Couldn't load this guide.</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!guide) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading guide…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {/* Title */}
        <Text style={styles.title}>{guide.title}</Text>

        {/* Meta badges */}
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>⏱ {guide.timeEstimate}</Text>
          <Text style={styles.badge}>📊 {guide.difficulty}</Text>
          <Text style={styles.badge}>{guide.vehicle.model}</Text>
        </View>

        {/* Tools */}
        {guide.tools.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tools required</Text>
            <View style={styles.tagRow}>
              {guide.tools.map((tool, i) => (
                <Text key={i} style={styles.toolTag}>{tool}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Safety notes */}
        {guide.safetyNotes.length > 0 && (
          <View style={styles.safetyBox}>
            <Text style={styles.safetyTitle}>⚠️  Safety notes</Text>
            {guide.safetyNotes.map((note, i) => (
              <Text key={i} style={styles.safetyText}>• {note}</Text>
            ))}
          </View>
        )}

        {/* Steps */}
        <Text style={styles.sectionTitle}>Steps ({guide.steps.length})</Text>
        {guide.steps.map((step: RepairStep) => (
          <View key={step.id} style={styles.stepCard}>
            <Text style={styles.stepNumber}>Step {step.stepOrder}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>

            {/* Image above description */}
            <StepImage step={step} onRetry={() => void retryStep(step.id)} />

            <Text style={styles.stepText}>{step.instruction}</Text>

            {step.torqueValue ? (
              <View style={styles.torqueRow}>
                <Text style={styles.torqueLabel}>🔩 Torque</Text>
                <Text style={styles.torqueValue}>{step.torqueValue}</Text>
              </View>
            ) : null}

            {step.warningNote ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>⚠  {step.warningNote}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  container: { padding: 18, gap: 14, paddingBottom: 48 },
  backRow: { marginBottom: 4 },
  backText: { color: '#f97316', fontWeight: '600', fontSize: 15 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', lineHeight: 30 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { backgroundColor: '#e5e7eb', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 13, color: '#374151' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  toolTag: { backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 13 },
  safetyBox: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 14, padding: 14, gap: 6 },
  safetyTitle: { fontWeight: '700', color: '#92400e', fontSize: 14 },
  safetyText: { color: '#78350f', fontSize: 13, lineHeight: 20 },
  stepCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, padding: 14, gap: 8 },
  stepNumber: { fontSize: 11, color: '#f97316', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  stepTitle: { fontWeight: '700', fontSize: 16, color: '#111827' },
  stepText: { color: '#374151', fontSize: 14, lineHeight: 21 },
  torqueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10 },
  torqueLabel: { fontSize: 12, color: '#166534', fontWeight: '600' },
  torqueValue: { fontSize: 14, fontWeight: '700', color: '#15803d' },
  warningBox: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 10 },
  warningText: { color: '#92400e', fontSize: 13 },
  image: { width: '100%', height: 220, borderRadius: 12 },
  imageSkeleton: { width: '100%', height: 160, borderRadius: 12, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', gap: 8 },
  skeletonText: { fontSize: 12, color: '#9ca3af' },
  imageFailedBox: { width: '100%', height: 60, borderRadius: 12, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', justifyContent: 'center', alignItems: 'center' },
  imageFailedText: { fontSize: 12, color: '#ef4444', fontWeight: '500' },
  loadingText: { color: '#9ca3af', marginTop: 8 },
  errorText: { fontSize: 16, color: '#6b7280' },
  backBtn: { backgroundColor: '#f97316', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 10 },
  backBtnText: { color: '#fff', fontWeight: '700' },
});
