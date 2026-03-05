import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, FlatList,
  KeyboardAvoidingView, Platform, Pressable, SafeAreaView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import type { RepairGuide } from '@motixai/shared';
import { authApi } from '@/lib/api';
import { tokenStore } from '@/store/authStore';
import { C, T, S, R, SHADOW, BTN_HEIGHT, INPUT_HEIGHT, SCREEN_H_PAD } from '@/theme';

function decodeJwt(token: string): { sub: string; email: string; role: string } {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as { sub: string; email: string; role: string };
  } catch {
    return { sub: '', email: '', role: '' };
  }
}

function initials(email: string): string {
  return email ? email[0].toUpperCase() : '?';
}

function DifficultyDot({ level }: { level: string }) {
  const color = level === 'BEGINNER' ? C.success : level === 'INTERMEDIATE' ? C.warning : C.error;
  return <View style={[dot.circle, { backgroundColor: color }]} />;
}
const dot = StyleSheet.create({ circle: { width: 7, height: 7, borderRadius: 99 } });

function GuideCard({ item, onPress }: { item: RepairGuide; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[gc.card, { transform: [{ scale }] }]}>
        <View style={gc.topRow}>
          <View style={gc.iconBox}>
            <Text style={gc.iconText}>🔧</Text>
          </View>
          <View style={gc.meta}>
            <Text style={gc.title} numberOfLines={2}>{item.title}</Text>
            <Text style={gc.sub}>{item.vehicle.model} · {item.part.name}</Text>
          </View>
        </View>
        <View style={gc.footer}>
          <View style={gc.badge}>
            <DifficultyDot level={item.difficulty} />
            <Text style={gc.badgeText}>{item.difficulty}</Text>
          </View>
          <View style={gc.badge}>
            <Text style={gc.badgeText}>⏱ {item.timeEstimate}</Text>
          </View>
          <View style={gc.badge}>
            <Text style={gc.badgeText}>{item.steps?.length ?? 0} steps</Text>
          </View>
          <Text style={gc.arrow}>›</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
const gc = StyleSheet.create({
  card:    { backgroundColor: C.bgCard, borderRadius: R.lg, padding: S.md, marginBottom: S.sm, ...SHADOW.xs, borderWidth: 1, borderColor: C.border },
  topRow:  { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  iconBox: { width: 44, height: 44, borderRadius: R.sm, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  iconText:{ fontSize: 20 },
  meta:    { flex: 1, gap: 3 },
  title:   { ...T.subhead, color: C.text },
  sub:     { ...T.small, color: C.textMuted },
  footer:  { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  badge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.bg, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 3 },
  badgeText:{ ...T.caption, color: C.textSub, fontWeight: '500', textTransform: undefined },
  arrow:   { marginLeft: 'auto', fontSize: 18, color: C.textMuted },
});

export default function DashboardScreen() {
  const router = useRouter();
  const [guides, setGuides]         = useState<RepairGuide[]>([]);
  const [vehicleModel, setVehicleModel] = useState('');
  const [partName, setPartName]     = useState('');
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isGuest, setIsGuest]       = useState(false);
  const [userEmail, setUserEmail]   = useState('');
  const [vmFocus, setVmFocus]       = useState(false);
  const [pnFocus, setPnFocus]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await tokenStore.accessToken();
      if (!token) { router.replace('/login'); return; }
      const claims = decodeJwt(token);
      setIsGuest(claims.role === 'GUEST');
      setUserEmail(claims.email ?? '');
      const api = await authApi();
      setGuides(await api.listGuides());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        await tokenStore.clear();
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const onCreate = async () => {
    if (isGuest) {
      Alert.alert('Sign up required', 'Create a free account to generate repair guides.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign up', onPress: () => router.push('/signup') },
      ]);
      return;
    }
    if (!vehicleModel.trim() || !partName.trim()) {
      Alert.alert('Missing fields', 'Enter both vehicle model and part name.'); return;
    }
    setGenerating(true);
    try {
      const api = await authApi();
      const created = await api.createGuide({ vehicleModel: vehicleModel.trim(), partName: partName.trim() });
      setGuides((prev) => [created, ...prev]);
      router.push(`/guides/${created.id}`);
    } catch (err) {
      Alert.alert('Generation failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerLabel}>MOTIXAI</Text>
            <Text style={s.headerTitle}>Dashboard</Text>
          </View>
          <View style={s.headerRight}>
            <Link href="/history" asChild>
              <Pressable style={s.historyBtn}>
                <Text style={s.historyBtnText}>History</Text>
              </Pressable>
            </Link>
            <Link href="/profile" asChild>
              <Pressable style={s.avatar}>
                <Text style={s.avatarText}>{initials(userEmail)}</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* ── Guest banner ── */}
        {isGuest && (
          <View style={s.guestBanner}>
            <View style={s.guestBannerInner}>
              <Text style={s.guestTitle}>👋 Guest session</Text>
              <Text style={s.guestSub}>Sign up free to save guides and unlock all features.</Text>
            </View>
            <Link href="/signup" asChild>
              <Pressable style={s.guestBtn}>
                <Text style={s.guestBtnText}>Sign up →</Text>
              </Pressable>
            </Link>
          </View>
        )}

        {/* ── Guides list ── */}
        <FlatList
          data={guides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            guides.length > 0
              ? <Text style={s.sectionLabel}>Recent guides ({guides.length})</Text>
              : null
          }
          ListEmptyComponent={
            loading ? (
              <View style={s.emptyState}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={s.emptyText}>Loading guides…</Text>
              </View>
            ) : (
              <View style={s.emptyState}>
                <Text style={s.emptyIcon}>📋</Text>
                <Text style={s.emptyTitle}>No guides yet</Text>
                <Text style={s.emptyText}>Generate your first repair guide below.</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <GuideCard item={item} onPress={() => router.push(`/guides/${item.id}`)} />
          )}
        />

        {/* ── Generate panel (bottom) ── */}
        <View style={s.genPanel}>
          <View style={s.genPanelInner}>
            <Text style={s.genTitle}>Generate repair guide</Text>
            <View style={s.genInputRow}>
              <TextInput
                style={[s.genInput, vmFocus && s.genInputFocus]}
                value={vehicleModel}
                onChangeText={setVehicleModel}
                onFocus={() => setVmFocus(true)}
                onBlur={() => setVmFocus(false)}
                placeholder="Vehicle (e.g. CAT 320D)"
                placeholderTextColor={C.textMuted}
                returnKeyType="next"
              />
              <TextInput
                style={[s.genInput, pnFocus && s.genInputFocus]}
                value={partName}
                onChangeText={setPartName}
                onFocus={() => setPnFocus(true)}
                onBlur={() => setPnFocus(false)}
                placeholder="Part (e.g. Hydraulic Pump)"
                placeholderTextColor={C.textMuted}
                returnKeyType="done"
                onSubmitEditing={onCreate}
              />
            </View>
            <Pressable
              style={({ pressed }) => [s.genBtn, generating && s.genBtnDisabled, pressed && { opacity: 0.88 }]}
              onPress={onCreate}
              disabled={generating}
            >
              {generating
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.genBtnText}>⚡ Generate guide</Text>
              }
            </Pressable>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: C.bg },
  kav:            { flex: 1 },

  // Header
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SCREEN_H_PAD, paddingTop: S.md, paddingBottom: S.sm },
  headerLabel:    { ...T.label, color: C.primary, marginBottom: 2 },
  headerTitle:    { ...T.title },
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  historyBtn:     { height: 36, paddingHorizontal: S.md, borderRadius: R.full, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgCard },
  historyBtnText: { ...T.smallBold, color: C.textSub },
  avatar:         { width: 42, height: 42, borderRadius: R.full, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.sm },
  avatarText:     { fontSize: 17, fontWeight: '700', color: '#fff' },

  // Guest banner
  guestBanner:    { marginHorizontal: SCREEN_H_PAD, marginBottom: S.sm, flexDirection: 'row', alignItems: 'center', backgroundColor: C.primaryLight, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.primaryBorder, gap: S.sm },
  guestBannerInner: { flex: 1, gap: 2 },
  guestTitle:     { ...T.smallBold, color: C.primaryDark },
  guestSub:       { ...T.caption, color: C.warning, fontWeight: '400', textTransform: undefined, letterSpacing: 0 },
  guestBtn:       { backgroundColor: C.primary, borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.sm },
  guestBtnText:   { fontSize: 13, fontWeight: '700', color: '#fff' },

  // List
  list:           { paddingHorizontal: SCREEN_H_PAD, paddingBottom: S.sm },
  sectionLabel:   { ...T.label, color: C.textMuted, marginBottom: S.sm, marginTop: S.xs },

  // Empty state
  emptyState:     { alignItems: 'center', paddingTop: S.xxxl, gap: S.sm },
  emptyIcon:      { fontSize: 40 },
  emptyTitle:     { ...T.subhead, color: C.textSub },
  emptyText:      { ...T.small, color: C.textMuted, textAlign: 'center' },

  // Generate panel
  genPanel:       { backgroundColor: C.bgCard, borderTopWidth: 1, borderTopColor: C.border, ...SHADOW.lg },
  genPanelInner:  { padding: SCREEN_H_PAD, gap: S.sm },
  genTitle:       { ...T.smallBold, color: C.textSub },
  genInputRow:    { gap: S.sm },
  genInput:       { height: INPUT_HEIGHT, borderWidth: 1.5, borderColor: C.border, borderRadius: R.md, paddingHorizontal: S.md, fontSize: 15, color: C.text, backgroundColor: C.bgSubtle },
  genInputFocus:  { borderColor: C.primary, backgroundColor: C.bgCard },
  genBtn:         { height: BTN_HEIGHT, backgroundColor: C.primary, borderRadius: R.full, alignItems: 'center', justifyContent: 'center', ...SHADOW.sm },
  genBtnDisabled: { opacity: 0.55 },
  genBtnText:     { fontSize: 16, fontWeight: '700', color: '#fff' },
});
