import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { mobileApi } from '@/lib/api';
import { tokenStore } from '@/store/authStore';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const result = await mobileApi.signup({ email, password });
      await tokenStore.save(result.accessToken, result.refreshToken ?? '');
      router.replace('/');
    } catch (error) {
      Alert.alert('Sign up failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start generating repair guides</Text>

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
          placeholder="Password (min 8 chars)"
        />

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onSignup} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating account…' : 'Sign up'}</Text>
        </Pressable>

        <Link href="/login" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkAccent}>Sign in</Text></Text>
          </Pressable>
        </Link>
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
  link: { alignItems: 'center', marginTop: 8 },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkAccent: { color: '#f97316', fontWeight: '600' },
});
