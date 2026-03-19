import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth_provider.dart';
import '../../../../app/theme.dart';
import 'auth_widgets.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey   = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  final _confCtrl  = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).signup(_emailCtrl.text.trim(), _passCtrl.text);
    if (!mounted) return;
    final err = ref.read(authProvider).error;
    if (err == null) context.go('/dashboard');
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authProvider);

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
                // Back
                Align(
                  alignment: Alignment.centerLeft,
                  child: GestureDetector(
                    onTap: () => context.go('/login'),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.arrow_back_ios, size: 16, color: kPrimary),
                        Text('Back', style: tsSmallBold.copyWith(color: kPrimary)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: s24),

                Text('Create account', style: tsTitle.copyWith(textBaseline: null)),
                const SizedBox(height: s8),
                Text('Get started with Motixi', style: tsBody.copyWith(color: kTextMuted)),
                const SizedBox(height: s32),

                if (state.error != null) ...[
                  AuthErrorBanner(state.error!),
                  const SizedBox(height: s16),
                ],

                _label('Email'),
                const SizedBox(height: s4 + 2),
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autocorrect: false,
                  decoration: authInputDecoration('you@example.com'),
                  validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
                ),
                const SizedBox(height: s16),

                _label('Password'),
                const SizedBox(height: s4 + 2),
                TextFormField(
                  controller: _passCtrl,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.next,
                  decoration: authInputDecoration('Min 6 characters').copyWith(
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility,
                          size: 20, color: kTextMuted),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  validator: (v) => (v == null || v.length < 6) ? 'Min 6 characters' : null,
                ),
                const SizedBox(height: s16),

                _label('Confirm password'),
                const SizedBox(height: s4 + 2),
                TextFormField(
                  controller: _confCtrl,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: authInputDecoration('Repeat password'),
                  validator: (v) => v != _passCtrl.text ? 'Passwords do not match' : null,
                ),
                const SizedBox(height: s24),

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
                      : const Text('Create account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: s16),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Already have an account? ', style: tsBody.copyWith(color: kTextMuted)),
                    GestureDetector(
                      onTap: () => context.go('/login'),
                      child: Text('Sign in', style: tsBody.copyWith(
                        color: kPrimary, fontWeight: FontWeight.w600,
                      )),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _label(String text) =>
      Text(text, style: tsLabel.copyWith(color: kTextSub));
}
