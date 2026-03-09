import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { mobileApi } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await mobileApi.forgotPassword(email.trim());
      setResetToken(res.resetToken);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (resetToken) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Reset token generated</Text>
          <Text style={styles.subtitle}>
            In production this would be emailed. Copy the token below and use it to reset your password.
          </Text>

          <View style={styles.tokenBox}>
            <Text style={styles.tokenText} selectable>{resetToken}</Text>
          </View>

          <Pressable
            style={styles.button}
            onPress={() => router.push({ pathname: '/reset-password', params: { token: resetToken } })}
          >
            <Text style={styles.buttonText}>Continue to reset password →</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>Enter your email and we'll generate a reset token.</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
        />

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Sending…' : 'Send reset token'}</Text>
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
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 14 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { color: '#6b7280', fontSize: 14, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  button: { backgroundColor: '#f97316', borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { alignItems: 'center', marginTop: 4 },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkAccent: { color: '#f97316', fontWeight: '600' },
  tokenBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tokenText: { fontSize: 12, color: '#374151', fontFamily: 'monospace' },
});
