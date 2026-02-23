import { View, Text, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { useAuthStore } from '@/store/authStore';

const stats = [
  { label: 'Requests', value: '1,234' },
  { label: 'AI Sessions', value: '456' },
  { label: 'Tokens Used', value: '89K' },
];

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const isDark = useColorScheme() === 'dark';

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.greeting, isDark && styles.textLight]}>
        Hello, {user?.name ?? 'User'} 👋
      </Text>
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.cardValue, isDark && styles.textLight]}>{s.value}</Text>
            <Text style={styles.cardLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f3f4f6' },
  containerDark: { backgroundColor: '#111827' },
  greeting: { fontSize: 22, fontWeight: '700', marginTop: 16, marginBottom: 24, color: '#111827' },
  textLight: { color: '#f9fafb' },
  statsRow: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: { backgroundColor: '#1f2937' },
  cardValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  cardLabel: { marginTop: 4, fontSize: 12, color: '#6b7280' },
});
