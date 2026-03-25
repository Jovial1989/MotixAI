import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../app/theme.dart';

enum StripeCheckoutResult {
  success,
  cancelled,
  failed,
}

class StripeCheckoutScreen extends StatefulWidget {
  final Uri checkoutUrl;
  final String title;

  const StripeCheckoutScreen({
    super.key,
    required this.checkoutUrl,
    this.title = 'Stripe',
  });

  @override
  State<StripeCheckoutScreen> createState() => _StripeCheckoutScreenState();
}

class _StripeCheckoutScreenState extends State<StripeCheckoutScreen> {
  late final WebViewController _controller;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _loading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onWebResourceError: (_) {
            if (mounted) Navigator.of(context).pop(StripeCheckoutResult.failed);
          },
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            final billingState = uri?.queryParameters['billing'];
            if (billingState == 'trial-started' || billingState == 'success') {
              Navigator.of(context).pop(StripeCheckoutResult.success);
              return NavigationDecision.prevent;
            }
            if (billingState == 'cancelled') {
              Navigator.of(context).pop(StripeCheckoutResult.cancelled);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(widget.checkoutUrl);
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (_, __) {
        Navigator.of(context).pop(StripeCheckoutResult.cancelled);
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          foregroundColor: kText,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () =>
                Navigator.of(context).pop(StripeCheckoutResult.cancelled),
          ),
          title: Text(widget.title),
        ),
        body: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_loading)
              const Center(
                child: CircularProgressIndicator(color: kPrimary),
              ),
          ],
        ),
      ),
    );
  }
}
