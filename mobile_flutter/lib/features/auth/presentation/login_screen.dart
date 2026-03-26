import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth_provider.dart';
import '../../../../app/theme.dart';
import '../../../l10n/generated/app_localizations.dart';
import 'auth_widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey  = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _continueAsGuest() async {
    await ref.read(authProvider.notifier).loginAsGuest();
    if (!mounted) return;
    final err = ref.read(authProvider).error;
    if (err == null) context.go('/dashboard');
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).login(_emailCtrl.text.trim(), _passCtrl.text);
    if (!mounted) return;
    final auth = ref.read(authProvider);
    if (auth.error == null) {
      context.go(auth.hasCompletedOnboarding ? '/dashboard' : '/onboarding');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = S.of(context)!;
    final state = ref.watch(authProvider);

    // Clear error on first rebuild after a new error appears
    ref.listen(authProvider, (_, next) {
      if (next.error != null) {
        Future.delayed(const Duration(seconds: 5), () {
          if (mounted) ref.read(authProvider.notifier).clearError();
        });
      }
    });

    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: s24, vertical: s48),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo
                Center(
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: kPrimary,
                      borderRadius: kRadiusLg,
                    ),
                    child: const Center(
                      child: Text('M', style: TextStyle(
                        fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white,
                      )),
                    ),
                  ),
                ),
                const SizedBox(height: s24),
                Text(l.welcomeBack, style: tsTitle.copyWith(textBaseline: null),
                  textAlign: TextAlign.center),
                const SizedBox(height: s8),
                Text(l.signInToAccount, style: tsBody.copyWith(color: kTextMuted),
                  textAlign: TextAlign.center),
                const SizedBox(height: s48),

                // Error banner
                if (state.error != null) ...[
                  AuthErrorBanner(state.error!),
                  const SizedBox(height: s16),
                ],

                // Email
                _Label(l.email),
                const SizedBox(height: s4 + 2),
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autocorrect: false,
                  decoration: authInputDecoration(l.emailPlaceholder),
                  validator: (v) => (v == null || !v.contains('@')) ? l.enterValidEmail : null,
                ),
                const SizedBox(height: s16),

                // Password
                _Label(l.password),
                const SizedBox(height: s4 + 2),
                TextFormField(
                  controller: _passCtrl,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: authInputDecoration(l.passwordPlaceholder).copyWith(
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility,
                          size: 20, color: kTextMuted),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  validator: (v) => (v == null || v.length < 6) ? l.minSixChars : null,
                ),
                const SizedBox(height: s24),

                // Submit
                FilledButton(
                  onPressed: state.isLoading ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: kPrimary,
                    minimumSize: const Size.fromHeight(52),
                    shape: RoundedRectangleBorder(borderRadius: kRadiusMd),
                  ),
                  child: state.isLoading
                      ? const SizedBox(height: 20, width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(l.signIn, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: s16),

                // Sign up link
                GestureDetector(
                  onTap: () => context.go('/signup'),
                  child: Text(
                    l.noAccountSignUp,
                    textAlign: TextAlign.center,
                    style: tsBody.copyWith(color: kTextMuted),
                  ),
                ),
                const SizedBox(height: s16),

                // Guest access
                GestureDetector(
                  onTap: state.isLoading ? null : _continueAsGuest,
                  child: Text(
                    l.continueAsGuest,
                    textAlign: TextAlign.center,
                    style: tsBody.copyWith(color: kTextMuted, decoration: TextDecoration.underline),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) =>
      Text(text, style: tsLabel.copyWith(color: kTextSub));
}
