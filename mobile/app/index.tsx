import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import type { RepairGuide } from '@motixai/shared';
import { authApi } from '@/lib/api';
import { tokenStore } from '@/store/authStore';

function decodeJwt(token: string): { sub: string; email: string; role: string } {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as { sub: string; email: string; role: string };
  } catch {
    return { sub: '', email: '', role: '' };
  }
}

export default function DashboardScreen() {
  const router = useRouter();
  const [guides, setGuides] = useState<RepairGuide[]>([]);
  const [vehicleModel, setVehicleModel] = useState('CAT 320D');
  const [partName, setPartName] = useState('Hydraulic Pump');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await tokenStore.accessToken();
      if (!token) {
        router.replace('/login');
        return;
      }
      const claims = decodeJwt(token);
      setIsGuest(claims.role === 'GUEST');
      const api = await authApi();
      const history = await api.listGuides();
      setGuides(history);
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
      Alert.alert(
        'Account required',
        'Create a free account to generate repair guides.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign up', onPress: () => router.push('/signup') },
        ],
      );
      return;
    }
    setGenerating(true);
    try {
      const api = await authApi();
      const created = await api.createGuide({ vehicleModel, partName });
      setGuides((prev) => [created, ...prev]);
      router.push(`/guides/${created.id}`);
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : 'Could not generate guide');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.headerText}>Dashboard</Text>
          <Link href="/profile" asChild>
            <Pressable style={styles.profileBtn}>
              <Text style={styles.profileBtnText}>Profile</Text>
            </Pressable>
          </Link>
        </View>

        {isGuest && (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerTitle}>Guest session</Text>
            <Text style={styles.guestBannerSub}>Sign up to generate and save repair guides.</Text>
            <Link href="/signup" asChild>
              <Pressable style={styles.guestSignupBtn}>
                <Text style={styles.guestSignupBtnText}>Create free account →</Text>
              </Pressable>
            </Link>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Generate repair guide</Text>
          <TextInput
            style={styles.input}
            value={vehicleModel}
            onChangeText={setVehicleModel}
            placeholder="Vehicle model (e.g. CAT 320D)"
          />
          <TextInput
            style={styles.input}
            value={partName}
            onChangeText={setPartName}
            placeholder="Part (e.g. Hydraulic Pump)"
          />
          <Pressable
            style={[styles.button, (generating || isGuest) && styles.buttonMuted]}
            onPress={onCreate}
            disabled={generating}
          >
            {generating
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>{isGuest ? 'Sign up to generate' : 'Generate guide'}</Text>
            }
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : guides.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No guides yet</Text>
            {!isGuest && <Text style={styles.emptySubText}>Generate your first repair guide above.</Text>}
          </View>
        ) : (
          <FlatList
            data={guides}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Link href={`/guides/${item.id}`} asChild>
                <Pressable style={styles.guideCard}>
                  <Text style={styles.guideTitle}>{item.title}</Text>
                  <Text style={styles.guideMeta}>{item.vehicle.model} · {item.part.name}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.badge}>{item.difficulty}</Text>
                    <Text style={styles.badge}>{item.timeEstimate}</Text>
                  </View>
                </Pressable>
              </Link>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1, padding: 18, gap: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  headerText: { fontSize: 28, fontWeight: '700', color: '#111827' },
  profileBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f3f4f6' },
  profileBtnText: { fontWeight: '600', color: '#374151', fontSize: 14 },
  guestBanner: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 14, padding: 14, gap: 6 },
  guestBannerTitle: { fontWeight: '700', color: '#92400e', fontSize: 14 },
  guestBannerSub: { color: '#78350f', fontSize: 13 },
  guestSignupBtn: { alignSelf: 'flex-start', marginTop: 4 },
  guestSignupBtnText: { color: '#f97316', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, padding: 14, gap: 10 },
  cardLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  button: { backgroundColor: '#f97316', borderRadius: 999, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', height: 46 },
  buttonMuted: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 16, color: '#6b7280', fontWeight: '600' },
  emptySubText: { fontSize: 13, color: '#9ca3af' },
  guideCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, padding: 14, marginBottom: 10, gap: 6 },
  guideTitle: { fontWeight: '700', fontSize: 16, color: '#111827' },
  guideMeta: { color: '#6b7280', fontSize: 13 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  badge: { backgroundColor: '#f3f4f6', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, color: '#374151' },
});
