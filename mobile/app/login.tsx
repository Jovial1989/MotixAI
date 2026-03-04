import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { mobileApi } from '@/lib/api';
import { tokenStore } from '@/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    try {
      const result = await mobileApi.login({ email, password });
      await tokenStore.save(result.accessToken, result.refreshToken ?? '');
      router.replace('/');
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const onGuest = async () => {
    setLoading(true);
    try {
      const result = await mobileApi.guest();
      await tokenStore.save(result.accessToken, '');
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>MotixAI</Text>
        <Text style={styles.subtitle}>AI repair guides for workshop teams</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
        />

        <Link href="/forgot-password" asChild>
          <Pressable style={styles.forgotLink}>
            <Text style={styles.forgotLinkText}>Forgot password?</Text>
          </Pressable>
        </Link>

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>

        <Link href="/signup" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>No account? <Text style={styles.linkAccent}>Sign up</Text></Text>
          </Pressable>
        </Link>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable style={[styles.ghostButton, loading && styles.buttonDisabled]} onPress={onGuest} disabled={loading}>
          <Text style={styles.ghostButtonText}>Continue as guest</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 34, fontWeight: '700', color: '#111827' },
  subtitle: { color: '#6b7280', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  button: { backgroundColor: '#f97316', borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { alignItems: 'center', marginTop: 4 },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkAccent: { color: '#f97316', fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { color: '#9ca3af', fontSize: 13 },
  ghostButton: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  ghostButtonText: { color: '#374151', fontWeight: '600' },
  forgotLink: { alignSelf: 'flex-end', marginTop: -4 },
  forgotLinkText: { color: '#f97316', fontSize: 13, fontWeight: '500' },
});
