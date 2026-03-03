import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { User, Mail, Shield, LogOut } from 'lucide-react-native';

const C = {
  orange: '#f97316',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  gray900: '#111827',
  red: '#ef4444',
};

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role === 'user' ? 'Free plan' : user?.role?.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.card}>
        <View style={styles.row}>
          <User size={16} color={C.gray500} />
          <View>
            <Text style={styles.rowLabel}>Full name</Text>
            <Text style={styles.rowValue}>{user?.name}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Mail size={16} color={C.gray500} />
          <View>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{user?.email}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Shield size={16} color={C.gray500} />
          <View>
            <Text style={styles.rowLabel}>Account type</Text>
            <Text style={styles.rowValue}>{user?.role === 'user' ? 'Free plan' : user?.role?.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => { logout(); router.replace('/login'); }}>
        <LogOut size={18} color={C.red} />
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.gray50 },
  content: { padding: 24, paddingBottom: 40 },
  avatarWrap: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: C.orange },
  name: { fontSize: 20, fontWeight: '700', color: C.gray900, marginBottom: 6 },
  roleBadge: {
    backgroundColor: '#ffedd5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100,
  },
  roleText: { color: C.orange, fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: C.white, borderRadius: 16, padding: 4,
    borderWidth: 1, borderColor: C.gray200, marginBottom: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  rowLabel: { fontSize: 11, color: C.gray500, marginBottom: 2 },
  rowValue: { fontSize: 14, fontWeight: '600', color: C.gray900 },
  divider: { height: 1, backgroundColor: C.gray200 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: C.red, borderRadius: 12, paddingVertical: 14,
  },
  logoutText: { color: C.red, fontWeight: '700', fontSize: 16 },
});
