import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { mobileApi } from '@/lib/api';
import { tokenStore } from '@/store/authStore';
import { C, T, S, R, SHADOW, BTN_HEIGHT, INPUT_HEIGHT, SCREEN_H_PAD } from '@/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);

  const onSignup = async () => {
    setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const result = await mobileApi.signup({ email: email.trim().toLowerCase(), password });
      await tokenStore.save(result.accessToken, result.refreshToken ?? '');
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Link href="/login" asChild>
            <Pressable style={s.backRow} hitSlop={8}>
              <Text style={s.backText}>← Back</Text>
            </Pressable>
          </Link>

          {/* Header */}
          <View style={s.header}>
            <View style={s.logoMark}>
              <Text style={s.logoMarkText}>M</Text>
            </View>
            <Text style={s.title}>Create account</Text>
            <Text style={s.subtitle}>Free forever · No credit card needed</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Your details</Text>

            <View style={s.field}>
              <Text style={s.fieldLabel}>EMAIL</Text>
              <TextInput
                style={[s.input, emailFocus && s.inputFocus]}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@company.com"
                placeholderTextColor={C.textMuted}
                returnKeyType="next"
                textContentType="emailAddress"
              />
            </View>

            <View style={s.field}>
              <Text style={s.fieldLabel}>PASSWORD</Text>
              <TextInput
                style={[s.input, passFocus && s.inputFocus]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPassFocus(true)}
                onBlur={() => setPassFocus(false)}
                secureTextEntry
                placeholder="Minimum 8 characters"
                placeholderTextColor={C.textMuted}
                returnKeyType="done"
                onSubmitEditing={onSignup}
                textContentType="newPassword"
              />
            </View>

            {/* Password strength hint */}
            {password.length > 0 && (
              <View style={s.strengthRow}>
                {[4,8,12].map((len) => (
                  <View key={len} style={[s.strengthBar, password.length >= len && s.strengthBarFill]} />
                ))}
                <Text style={s.strengthLabel}>
                  {password.length < 4 ? 'Too short' : password.length < 8 ? 'Weak' : password.length < 12 ? 'Good' : 'Strong'}
                </Text>
              </View>
            )}

            {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

            <Pressable
              style={({ pressed }) => [s.btn, loading && s.btnDisabled, pressed && s.btnPressed]}
              onPress={onSignup}
              disabled={loading}
            >
              <Text style={s.btnText}>{loading ? 'Creating account…' : 'Create account'}</Text>
            </Pressable>

            <Text style={s.terms}>
              By signing up you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <Pressable hitSlop={8}>
                <Text style={s.footerLink}>Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: C.bg },
  kav:            { flex: 1 },
  scroll:         { flexGrow: 1, paddingHorizontal: SCREEN_H_PAD, paddingBottom: S.xl },

  backRow:        { paddingTop: S.md, paddingBottom: S.sm },
  backText:       { ...T.smallBold, color: C.primary },

  header:         { alignItems: 'center', paddingVertical: S.lg },
  logoMark:       { width: 56, height: 56, borderRadius: R.md, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: S.md, ...SHADOW.md },
  logoMarkText:   { fontSize: 24, fontWeight: '800', color: '#fff' },
  title:          { ...T.title },
  subtitle:       { ...T.small, color: C.textMuted, marginTop: S.xs },

  card:           { backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.lg, gap: S.md, ...SHADOW.sm },
  cardTitle:      { ...T.heading, marginBottom: S.xs },

  field:          { gap: S.xs },
  fieldLabel:     { ...T.label },
  input:          { height: INPUT_HEIGHT, borderWidth: 1.5, borderColor: C.border, borderRadius: R.md, paddingHorizontal: S.md, fontSize: 15, color: C.text, backgroundColor: C.bgSubtle },
  inputFocus:     { borderColor: C.primary, backgroundColor: C.bgCard },

  strengthRow:    { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  strengthBar:    { flex: 1, height: 3, borderRadius: 99, backgroundColor: C.border },
  strengthBarFill:{ backgroundColor: C.primary },
  strengthLabel:  { ...T.caption, color: C.textMuted, minWidth: 48 },

  errorBox:       { backgroundColor: C.errorLight, borderRadius: R.sm, padding: S.sm, borderWidth: 1, borderColor: C.errorBorder },
  errorText:      { ...T.small, color: C.error, fontWeight: '500' },

  btn:            { height: BTN_HEIGHT, backgroundColor: C.primary, borderRadius: R.full, alignItems: 'center', justifyContent: 'center', ...SHADOW.sm },
  btnPressed:     { opacity: 0.88 },
  btnDisabled:    { opacity: 0.55 },
  btnText:        { fontSize: 16, fontWeight: '700', color: '#fff' },

  terms:          { ...T.caption, color: C.textMuted, textAlign: 'center', lineHeight: 16 },

  footer:         { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: S.lg },
  footerText:     { ...T.small, color: C.textMuted },
  footerLink:     { ...T.smallBold, color: C.primary },
});
