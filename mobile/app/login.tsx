import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { mobileApi } from '@/lib/api';
import { tokenStore } from '@/store/authStore';
import { C, T, S, R, SHADOW, BTN_HEIGHT, INPUT_HEIGHT, SCREEN_H_PAD } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);

  const onLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const result = await mobileApi.login({ email: email.trim().toLowerCase(), password });
      await tokenStore.save(result.accessToken, result.refreshToken ?? '');
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const onGuest = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await mobileApi.guest();
      await tokenStore.save(result.accessToken, '');
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start guest session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo area */}
          <View style={s.logoArea}>
            <View style={s.logoMark}>
              <Text style={s.logoMarkText}>M</Text>
            </View>
            <Text style={s.logoName}>MotixAI</Text>
            <Text style={s.tagline}>Repair intelligence for the field</Text>
          </View>

          {/* Form card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Sign in</Text>

            {/* Email */}
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

            {/* Password */}
            <View style={s.field}>
              <Text style={s.fieldLabel}>PASSWORD</Text>
              <TextInput
                style={[s.input, passFocus && s.inputFocus]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPassFocus(true)}
                onBlur={() => setPassFocus(false)}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={C.textMuted}
                returnKeyType="done"
                onSubmitEditing={onLogin}
                textContentType="password"
              />
            </View>

            <Link href="/forgot-password" asChild>
              <Pressable hitSlop={8}>
                <Text style={s.forgotText}>Forgot password?</Text>
              </Pressable>
            </Link>

            {/* Error */}
            {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

            {/* CTA */}
            <Pressable
              style={({ pressed }) => [s.btn, loading && s.btnDisabled, pressed && s.btnPressed]}
              onPress={onLogin}
              disabled={loading}
            >
              <Text style={s.btnText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
            </Pressable>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerLabel}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Guest */}
            <Pressable
              style={({ pressed }) => [s.ghostBtn, loading && s.btnDisabled, pressed && s.ghostBtnPressed]}
              onPress={onGuest}
              disabled={loading}
            >
              <Text style={s.ghostBtnText}>Continue as guest</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <Link href="/signup" asChild>
              <Pressable hitSlop={8}>
                <Text style={s.footerLink}>Sign up free</Text>
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

  // Logo
  logoArea:       { alignItems: 'center', paddingTop: S.xxxl, paddingBottom: S.xl },
  logoMark:       { width: 64, height: 64, borderRadius: R.md, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: S.md, ...SHADOW.md },
  logoMarkText:   { fontSize: 28, fontWeight: '800', color: '#fff' },
  logoName:       { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  tagline:        { ...T.small, marginTop: S.xs, color: C.textMuted },

  // Card
  card:           { backgroundColor: C.bgCard, borderRadius: R.xl, padding: S.lg, gap: S.md, ...SHADOW.sm },
  cardTitle:      { ...T.heading, marginBottom: S.xs },

  // Field
  field:          { gap: S.xs },
  fieldLabel:     { ...T.label },
  input:          { height: INPUT_HEIGHT, borderWidth: 1.5, borderColor: C.border, borderRadius: R.md, paddingHorizontal: S.md, fontSize: 15, color: C.text, backgroundColor: C.bgSubtle },
  inputFocus:     { borderColor: C.primary, backgroundColor: C.bgCard },

  forgotText:     { ...T.smallBold, color: C.primary, alignSelf: 'flex-end' },

  // Error
  errorBox:       { backgroundColor: C.errorLight, borderRadius: R.sm, padding: S.sm, borderWidth: 1, borderColor: C.errorBorder },
  errorText:      { ...T.small, color: C.error, fontWeight: '500' },

  // Primary button
  btn:            { height: BTN_HEIGHT, backgroundColor: C.primary, borderRadius: R.full, alignItems: 'center', justifyContent: 'center', ...SHADOW.sm },
  btnPressed:     { opacity: 0.88 },
  btnDisabled:    { opacity: 0.55 },
  btnText:        { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },

  // Divider
  divider:        { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  dividerLine:    { flex: 1, height: 1, backgroundColor: C.border },
  dividerLabel:   { ...T.caption, color: C.textMuted },

  // Ghost button
  ghostBtn:       { height: BTN_HEIGHT, borderWidth: 1.5, borderColor: C.border, borderRadius: R.full, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgCard },
  ghostBtnPressed:{ backgroundColor: C.bgSubtle },
  ghostBtnText:   { fontSize: 15, fontWeight: '600', color: C.textSub },

  // Footer
  footer:         { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: S.lg },
  footerText:     { ...T.small, color: C.textMuted },
  footerLink:     { ...T.smallBold, color: C.primary },
});
