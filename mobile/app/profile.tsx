import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { tokenStore } from '@/store/authStore';

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
  } catch {
    return null;
  }
}

const ROLE_LABELS: Record<string, string> = {
  USER: 'Standard account',
  ENTERPRISE_ADMIN: 'Enterprise admin',
  GUEST: 'Guest',
};

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{claims?.email ?? '—'}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Account type</Text>
          <View style={styles.roleRow}>
            <Text style={[styles.roleBadge, isGuest && styles.roleBadgeGuest]}>
              {ROLE_LABELS[claims?.role ?? ''] ?? '—'}
            </Text>
          </View>
        </View>

        {isGuest && (
          <View style={styles.guestCard}>
            <Text style={styles.guestTitle}>You're on a guest session</Text>
            <Text style={styles.guestSub}>
              Create a free account to save guides, build history, and unlock all features.
            </Text>
            <Link href="/signup" asChild>
              <Pressable style={styles.signupBtn}>
                <Text style={styles.signupBtnText}>Create account</Text>
              </Pressable>
            </Link>
            <Link href="/login" asChild>
              <Pressable style={styles.loginLink}>
                <Text style={styles.loginLinkText}>Already have one? Sign in</Text>
              </Pressable>
            </Link>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>{isGuest ? 'Exit guest session' : 'Sign out'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1, padding: 18, gap: 14 },
  backRow: { marginBottom: -4 },
  backText: { color: '#f97316', fontWeight: '600', fontSize: 15 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', paddingTop: 4 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, padding: 16, gap: 4 },
  label: { fontSize: 11, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  value: { fontSize: 16, color: '#111827', marginBottom: 4 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 8 },
  roleRow: { marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
  },
  roleBadgeGuest: { backgroundColor: '#fef9c3', color: '#854d0e' },
  guestCard: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 16, padding: 16, gap: 8 },
  guestTitle: { fontWeight: '700', color: '#92400e', fontSize: 15 },
  guestSub: { color: '#78350f', fontSize: 13, lineHeight: 19 },
  signupBtn: { backgroundColor: '#f97316', borderRadius: 999, paddingVertical: 11, alignItems: 'center', marginTop: 4 },
  signupBtnText: { color: '#fff', fontWeight: '700' },
  loginLink: { alignItems: 'center', paddingVertical: 4 },
  loginLinkText: { color: '#f97316', fontSize: 13, fontWeight: '600' },
  logoutBtn: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, paddingVertical: 13, alignItems: 'center', marginBottom: 8, backgroundColor: '#fff' },
  logoutBtnText: { color: '#374151', fontWeight: '600' },
});
