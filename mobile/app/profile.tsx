import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { tokenStore } from '@/store/authStore';
import { C, T, S, R, SHADOW, BTN_HEIGHT, SCREEN_H_PAD } from '@/theme';

interface TokenClaims {
  sub: string;
  email: string;
  role: 'USER' | 'ENTERPRISE_ADMIN' | 'GUEST';
  tenantId: string | null;
}

function decodeJwt(token: string): TokenClaims | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as TokenClaims;
  } catch { return null; }
}

function initials(email: string) { return email ? email[0].toUpperCase() : '?' }

const ROLE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  USER:             { label: 'Standard',        color: '#1e40af', bg: '#dbeafe', border: '#bfdbfe' },
  ENTERPRISE_ADMIN: { label: 'Enterprise Admin', color: '#065f46', bg: '#d1fae5', border: '#a7f3d0' },
  GUEST:            { label: 'Guest',            color: '#854d0e', bg: '#fef9c3', border: '#fde68a' },
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={ir.row}>
      <Text style={ir.label}>{label}</Text>
      <Text style={ir.value}>{value}</Text>
    </View>
  );
}
const ir = StyleSheet.create({
  row:   { paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.border },
  label: { ...T.label, marginBottom: 4 },
  value: { ...T.body, color: C.text, fontWeight: '500' },
});

export default function ProfileScreen() {
  const router = useRouter();
  const [claims, setClaims] = useState<TokenClaims | null>(null);

  useEffect(() => {
    tokenStore.accessToken().then((token) => {
      if (token) setClaims(decodeJwt(token));
    });
  }, []);

  async function logout() {
    await tokenStore.clear();
    router.replace('/login');
  }

  const isGuest = claims?.role === 'GUEST';
  const roleMeta = ROLE_META[claims?.role ?? ''] ?? ROLE_META.GUEST;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backRow} onPress={() => router.back()} hitSlop={8}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backLabel}>Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + email hero */}
        <View style={s.heroCard}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials(claims?.email ?? '')}</Text>
          </View>
          <Text style={s.heroEmail}>{claims?.email ?? '—'}</Text>
          <View style={[s.roleBadge, { backgroundColor: roleMeta.bg, borderColor: roleMeta.border }]}>
            <Text style={[s.roleBadgeText, { color: roleMeta.color }]}>{roleMeta.label}</Text>
          </View>
        </View>

        {/* Account details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Account</Text>
          <InfoRow label="EMAIL" value={claims?.email ?? '—'} />
          <InfoRow label="ACCOUNT TYPE" value={roleMeta.label} />
          {claims?.tenantId && (
            <InfoRow label="ORGANISATION ID" value={claims.tenantId} />
          )}
        </View>

        {/* Guest upsell */}
        {isGuest && (
          <View style={s.upsellCard}>
            <View style={s.upsellIconRow}>
              <Text style={s.upsellIcon}>✨</Text>
              <Text style={s.upsellTitle}>Unlock full access</Text>
            </View>
            <Text style={s.upsellBody}>
              Create a free account to generate and save repair guides, build your history, and collaborate with your workshop team.
            </Text>
            <Link href="/signup" asChild>
              <Pressable style={({ pressed }) => [s.upsellBtn, pressed && { opacity: 0.88 }]}>
                <Text style={s.upsellBtnText}>Create free account</Text>
              </Pressable>
            </Link>
            <Link href="/login" asChild>
              <Pressable hitSlop={8} style={s.upsellSecondary}>
                <Text style={s.upsellSecondaryText}>Already have an account? Sign in</Text>
              </Pressable>
            </Link>
          </View>
        )}

        {/* App info */}
        <View style={s.infoCard}>
          <Text style={s.infoRow}>MotixAI · Repair Intelligence</Text>
          <Text style={s.infoRow}>Version 1.0.0</Text>
        </View>

        {/* Sign out */}
        <Pressable
          style={({ pressed }) => [s.logoutBtn, pressed && { opacity: 0.85 }]}
          onPress={logout}
        >
          <Text style={s.logoutBtnText}>
            {isGuest ? '✕  Exit guest session' : '→  Sign out'}
          </Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: C.bg },

  // Header
  header:           { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: SCREEN_H_PAD, paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bgCard },
  backRow:          { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  backArrow:        { fontSize: 20, color: C.primary, fontWeight: '700' },
  backLabel:        { ...T.smallBold, color: C.primary },
  headerTitle:      { ...T.heading, marginLeft: S.xs },

  scroll:           { paddingHorizontal: SCREEN_H_PAD, paddingBottom: S.xl, gap: S.md, paddingTop: S.md },

  // Hero card
  heroCard:         { backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.lg, alignItems: 'center', gap: S.sm, ...SHADOW.sm, borderWidth: 1, borderColor: C.border },
  avatarCircle:     { width: 72, height: 72, borderRadius: R.full, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.md },
  avatarText:       { fontSize: 30, fontWeight: '800', color: '#fff' },
  heroEmail:        { ...T.subhead, color: C.text },
  roleBadge:        { borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.xs, borderWidth: 1 },
  roleBadgeText:    { fontSize: 12, fontWeight: '700' },

  // Account card
  card:             { backgroundColor: C.bgCard, borderRadius: R.lg, padding: S.md, ...SHADOW.xs, borderWidth: 1, borderColor: C.border },
  cardTitle:        { ...T.smallBold, color: C.textSub, marginBottom: S.xs },

  // Upsell card
  upsellCard:       { backgroundColor: C.primaryLight, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.primaryBorder, gap: S.sm },
  upsellIconRow:    { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  upsellIcon:       { fontSize: 18 },
  upsellTitle:      { ...T.subhead, color: C.primaryDark },
  upsellBody:       { ...T.small, color: C.primaryDark, lineHeight: 20 },
  upsellBtn:        { height: BTN_HEIGHT - 4, backgroundColor: C.primary, borderRadius: R.full, alignItems: 'center', justifyContent: 'center', ...SHADOW.sm },
  upsellBtnText:    { fontSize: 15, fontWeight: '700', color: '#fff' },
  upsellSecondary:  { alignItems: 'center', paddingVertical: S.xs },
  upsellSecondaryText: { ...T.smallBold, color: C.primary },

  // App info
  infoCard:         { backgroundColor: C.bgCard, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border, gap: S.xs, alignItems: 'center' },
  infoRow:          { ...T.caption, color: C.textMuted, fontWeight: '400', textTransform: undefined, letterSpacing: 0 },

  // Logout
  logoutBtn:        { height: BTN_HEIGHT, borderRadius: R.full, borderWidth: 1.5, borderColor: C.errorBorder, backgroundColor: C.errorLight, alignItems: 'center', justifyContent: 'center' },
  logoutBtnText:    { fontSize: 15, fontWeight: '600', color: C.error },
});
