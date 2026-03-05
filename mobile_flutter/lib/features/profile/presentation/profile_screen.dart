import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/auth_provider.dart';
import '../../../shared/widgets/mx_widgets.dart';
import '../../../app/theme.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.tokens?.user;

    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: s16, vertical: s12),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: kBorder)),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Icon(Icons.arrow_back_ios, size: 20, color: kPrimary),
                  ),
                  const SizedBox(width: s12),
                  Text('Profile', style: tsSubhead),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(s16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Avatar card
                    Container(
                      padding: const EdgeInsets.all(s24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: kRadiusLg,
                        border: Border.all(color: kBorder),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 64, height: 64,
                            decoration: const BoxDecoration(
                              color: kPrimary, shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                user?.email.isNotEmpty == true
                                    ? user!.email[0].toUpperCase()
                                    : 'U',
                                style: const TextStyle(
                                  fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: s16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(user?.email ?? '—', style: tsSubhead,
                                  overflow: TextOverflow.ellipsis),
                                const SizedBox(height: s4),
                                MxChip(
                                  user?.role ?? 'USER',
                                  bg: kPrimaryLight,
                                  border: kPrimaryBorder,
                                  textColor: kPrimaryDark,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: s16),

                    MxSectionHeader('Account'),
                    _TileCard(children: [
                      _InfoRow(label: 'Email', value: user?.email ?? '—'),
                      _Divider(),
                      _InfoRow(label: 'Role', value: user?.role ?? '—'),
                      if (user?.tenantId != null) ...[
                        _Divider(),
                        _InfoRow(label: 'Tenant', value: user!.tenantId!),
                      ],
                    ]),
                    const SizedBox(height: s16),

                    MxSectionHeader('Navigation'),
                    _TileCard(children: [
                      _NavRow(
                        icon: Icons.history,
                        label: 'Guide History',
                        onTap: () => context.push('/history'),
                      ),
                    ]),
                    const SizedBox(height: s32),

                    // Sign out
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () async {
                          await ref.read(authProvider.notifier).logout();
                          if (context.mounted) context.go('/login');
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFDC2626),
                          side: const BorderSide(color: Color(0xFFFCA5A5)),
                          minimumSize: const Size.fromHeight(52),
                          shape: RoundedRectangleBorder(borderRadius: kRadiusMd),
                        ),
                        child: const Text('Sign out', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TileCard extends StatelessWidget {
  final List<Widget> children;
  const _TileCard({required this.children});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: kRadiusLg,
      border: Border.all(color: kBorder),
    ),
    child: Column(children: children),
  );
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: s16, vertical: s12),
    child: Row(
      children: [
        Text(label, style: tsCaption.copyWith(color: kTextMuted, fontWeight: FontWeight.w600)),
        const Spacer(),
        Text(value, style: tsCaption.copyWith(color: kText), overflow: TextOverflow.ellipsis),
      ],
    ),
  );
}

class _NavRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _NavRow({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: kRadiusLg,
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: s16, vertical: s14),
      child: Row(
        children: [
          Icon(icon, size: 18, color: kPrimary),
          const SizedBox(width: s12),
          Expanded(child: Text(label, style: tsSmallBold)),
          const Icon(Icons.chevron_right, size: 18, color: kTextMuted),
        ],
      ),
    ),
  );
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
      Divider(height: 1, color: kBorder, indent: s16, endIndent: s16);
}
