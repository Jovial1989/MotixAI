import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { mobileApi } from '@/lib/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const [resetToken, setResetToken] = useState(params.token ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!resetToken.trim()) {
      Alert.alert('Missing token', 'Paste the reset token you received.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await mobileApi.resetPassword(resetToken.trim(), newPassword);
      Alert.alert('Password updated', 'You can now sign in with your new password.', [
        { text: 'Sign in', onPress: () => router.replace('/login') },
      ]);
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>Enter your reset token and choose a new password.</Text>

        <TextInput
          style={styles.input}
          value={resetToken}
          onChangeText={setResetToken}
          autoCapitalize="none"
          placeholder="Reset token"
          multiline
        />

        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="New password (min 8 chars)"
        />

        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Confirm new password"
        />

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Updating…' : 'Update password'}</Text>
        </Pressable>

        <Link href="/login" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>Back to <Text style={styles.linkAccent}>Sign in</Text></Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { color: '#6b7280', fontSize: 14, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  button: { backgroundColor: '#f97316', borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { alignItems: 'center', marginTop: 4 },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkAccent: { color: '#f97316', fontWeight: '600' },
});
