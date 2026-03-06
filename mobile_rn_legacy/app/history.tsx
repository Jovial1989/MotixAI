import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable,
  SafeAreaView, StyleSheet, Text, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { RepairGuide } from '@motixai/shared';
import { authApi } from '@/lib/api';
import { C, T, S, R, SHADOW, SCREEN_H_PAD } from '@/theme';

function DifficultyDot({ level }: { level: string }) {
  const color = level === 'BEGINNER' ? C.success : level === 'INTERMEDIATE' ? C.warning : C.error;
  return <View style={[dot.circle, { backgroundColor: color }]} />;
}
const dot = StyleSheet.create({ circle: { width: 7, height: 7, borderRadius: 99 } });

function HistoryCard({ item, onPress }: { item: RepairGuide; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]}
      onPress={onPress}
    >
      <View style={s.cardTop}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={s.chevron}>›</Text>
      </View>
      <Text style={s.cardSub}>{item.vehicle.model} · {item.part.name}</Text>
      <View style={s.cardFooter}>
        <View style={s.badge}>
          <DifficultyDot level={item.difficulty} />
          <Text style={s.badgeText}>{item.difficulty}</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>⏱ {item.timeEstimate}</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>{item.steps?.length ?? 0} steps</Text>
        </View>
        <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const [guides, setGuides] = useState<RepairGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const api = await authApi();
      setGuides(await api.listGuides());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backRow} onPress={() => router.back()} hitSlop={8}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backLabel}>Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>History</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.centerText}>Loading history…</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={s.errorIcon}>⚠️</Text>
          <Text style={s.centerText}>{error}</Text>
          <Pressable style={s.retryBtn} onPress={load}>
            <Text style={s.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={guides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onRefresh={load}
          refreshing={loading}
          ListHeaderComponent={
            guides.length > 0
              ? <Text style={s.sectionLabel}>{guides.length} guide{guides.length !== 1 ? 's' : ''}</Text>
              : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTitle}>No guides yet</Text>
              <Text style={s.emptyText}>Generate your first guide from the Dashboard.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <HistoryCard item={item} onPress={() => router.push(`/guides/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: SCREEN_H_PAD, paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bgCard },
  backRow:     { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  backArrow:   { fontSize: 20, color: C.primary, fontWeight: '700' },
  backLabel:   { ...T.smallBold, color: C.primary },
  headerTitle: { ...T.heading, marginLeft: S.xs },

  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: S.sm },
  centerText:  { ...T.body, color: C.textMuted },
  errorIcon:   { fontSize: 32 },
  retryBtn:    { backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: S.lg, paddingVertical: S.sm },
  retryText:   { fontSize: 14, fontWeight: '700', color: '#fff' },

  list:        { paddingHorizontal: SCREEN_H_PAD, paddingTop: S.sm, paddingBottom: S.xl },
  sectionLabel:{ ...T.label, color: C.textMuted, marginBottom: S.sm, marginTop: S.xs },

  empty:       { alignItems: 'center', paddingTop: 80, gap: S.sm },
  emptyIcon:   { fontSize: 40 },
  emptyTitle:  { ...T.subhead, color: C.textSub },
  emptyText:   { ...T.small, color: C.textMuted, textAlign: 'center' },

  card:        { backgroundColor: C.bgCard, borderRadius: R.lg, padding: S.md, marginBottom: S.sm, ...SHADOW.xs, borderWidth: 1, borderColor: C.border, gap: S.xs },
  cardTop:     { flexDirection: 'row', alignItems: 'flex-start', gap: S.xs },
  cardTitle:   { ...T.subhead, flex: 1 },
  chevron:     { fontSize: 18, color: C.textMuted },
  cardSub:     { ...T.small, color: C.textMuted },
  cardFooter:  { flexDirection: 'row', alignItems: 'center', gap: S.xs, flexWrap: 'wrap', marginTop: S.xs },
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bg, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  badgeText:   { ...T.caption, color: C.textSub, fontWeight: '500', textTransform: undefined },
  date:        { ...T.caption, color: C.textMuted, marginLeft: 'auto', textTransform: undefined, letterSpacing: 0 },
});
