import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { Search, Heart, Clock } from 'lucide-react-native';

const C = {
  orange: '#f97316',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  gray900: '#111827',
};

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>What do you need to repair?</Text>
        <Text style={styles.heroSub}>Enter vehicle + part to get your guide</Text>
        <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/(tabs)/search')}>
          <Search size={18} color="#fff" />
          <Text style={styles.searchBtnText}>Search repair guide</Text>
        </TouchableOpacity>
      </View>

      {/* Quick links */}
      <Text style={styles.sectionTitle}>Quick access</Text>
      <View style={styles.quickLinks}>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(tabs)/search')}>
          <Search size={20} color={C.orange} />
          <Text style={styles.quickLabel}>New guide</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(tabs)/favorites')}>
          <Heart size={20} color={C.orange} />
          <Text style={styles.quickLabel}>Saved</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(tabs)/history')}>
          <Clock size={20} color={C.orange} />
          <Text style={styles.quickLabel}>History</Text>
        </TouchableOpacity>
      </View>

      {/* User card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.gray50 },
  content: { padding: 20, paddingBottom: 40 },
  hero: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.gray900, textAlign: 'center', marginBottom: 6 },
  heroSub: { fontSize: 14, color: C.gray500, textAlign: 'center', marginBottom: 20 },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.orange, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: C.gray900, marginBottom: 12 },
  quickLinks: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickCard: {
    flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.gray200,
  },
  quickLabel: { fontSize: 12, fontWeight: '600', color: C.gray900 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.gray200,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: C.orange },
  userName: { fontSize: 15, fontWeight: '600', color: C.gray900 },
  userEmail: { fontSize: 13, color: C.gray500, marginTop: 2 },
});
