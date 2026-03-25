import 'package:flutter/material.dart';

import '../../../app/theme.dart';

enum _RepairVisualType {
  oil,
  brakes,
  turbo,
  battery,
  filter,
  cooling,
  suspension,
  engine,
  generic,
}

enum _VehicleSilhouetteType {
  sedan,
  suv,
  pickup,
  van,
}

class RepairMetaPill extends StatelessWidget {
  final String label;
  final double iconSize;
  final EdgeInsetsGeometry? padding;

  const RepairMetaPill({
    super.key,
    required this.label,
    this.iconSize = 14,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final type = _classifyRepair(label);
    return Container(
      padding:
          padding ?? const EdgeInsets.symmetric(horizontal: s10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: kRadiusFull,
        border: Border.all(color: kBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _RepairIcon(type: type, size: iconSize),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: tsCaption.copyWith(
                color: kTextSub,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class GuideVehicleIllustration extends StatelessWidget {
  final String vehicleModel;
  final String repairLabel;
  final double width;
  final double height;
  final EdgeInsetsGeometry padding;

  const GuideVehicleIllustration({
    super.key,
    required this.vehicleModel,
    required this.repairLabel,
    this.width = 156,
    this.height = 116,
    this.padding = const EdgeInsets.all(14),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      padding: padding,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFF8FBFF),
            Color(0xFFEEF4FB),
          ],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: CustomPaint(
        painter: _VehicleIllustrationPainter(
          silhouette: _classifyVehicle(vehicleModel),
          repairType: _classifyRepair(repairLabel),
        ),
      ),
    );
  }
}

class _RepairIcon extends StatelessWidget {
  final _RepairVisualType type;
  final double size;

  const _RepairIcon({
    required this.type,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    final icon = switch (type) {
      _RepairVisualType.oil => Icons.opacity_outlined,
      _RepairVisualType.brakes => Icons.album_outlined,
      _RepairVisualType.turbo => Icons.autorenew_rounded,
      _RepairVisualType.battery => Icons.battery_5_bar_rounded,
      _RepairVisualType.filter => Icons.tune_rounded,
      _RepairVisualType.cooling => Icons.mode_fan_off_outlined,
      _RepairVisualType.suspension => Icons.linear_scale_rounded,
      _RepairVisualType.engine => Icons.settings_outlined,
      _RepairVisualType.generic => Icons.build_circle_outlined,
    };
    return Icon(icon, size: size, color: kPrimary);
  }
}

class _VehicleIllustrationPainter extends CustomPainter {
  final _VehicleSilhouetteType silhouette;
  final _RepairVisualType repairType;

  const _VehicleIllustrationPainter({
    required this.silhouette,
    required this.repairType,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final stroke = Paint()
      ..color = const Color(0xFF334155)
      ..strokeWidth = w * 0.022
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final lightStroke = Paint()
      ..color = const Color(0xFFCBD5E1)
      ..strokeWidth = w * 0.014
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final accent = Paint()
      ..color = kPrimary
      ..strokeWidth = w * 0.020
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final windowFill = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..style = PaintingStyle.fill;

    final baseY = h * 0.74;
    final leftWheelX = w * 0.26;
    final rightWheelX = w * 0.74;
    final wheelR = w * 0.10;

    // Draw body silhouette
    final body = Path();
    switch (silhouette) {
      case _VehicleSilhouetteType.sedan:
        body
          ..moveTo(w * 0.08, baseY)
          ..lineTo(w * 0.16, h * 0.52)
          ..lineTo(w * 0.30, h * 0.36)
          ..lineTo(w * 0.62, h * 0.36)
          ..lineTo(w * 0.78, h * 0.50)
          ..lineTo(w * 0.90, h * 0.56)
          ..lineTo(w * 0.92, baseY);
        // Windows
        final sedanWin = Path()
          ..moveTo(w * 0.31, h * 0.38)
          ..lineTo(w * 0.18, h * 0.50)
          ..lineTo(w * 0.46, h * 0.50)
          ..lineTo(w * 0.46, h * 0.38)
          ..close();
        canvas.drawPath(sedanWin, windowFill);
        canvas.drawPath(sedanWin, lightStroke);
        final sedanWin2 = Path()
          ..moveTo(w * 0.48, h * 0.38)
          ..lineTo(w * 0.48, h * 0.50)
          ..lineTo(w * 0.72, h * 0.50)
          ..lineTo(w * 0.60, h * 0.38)
          ..close();
        canvas.drawPath(sedanWin2, windowFill);
        canvas.drawPath(sedanWin2, lightStroke);
        break;
      case _VehicleSilhouetteType.suv:
        body
          ..moveTo(w * 0.06, baseY)
          ..lineTo(w * 0.14, h * 0.48)
          ..lineTo(w * 0.28, h * 0.32)
          ..lineTo(w * 0.64, h * 0.32)
          ..lineTo(w * 0.78, h * 0.44)
          ..lineTo(w * 0.90, h * 0.52)
          ..lineTo(w * 0.94, baseY);
        // Windows
        final suvWin = Path()
          ..moveTo(w * 0.29, h * 0.34)
          ..lineTo(w * 0.16, h * 0.46)
          ..lineTo(w * 0.42, h * 0.46)
          ..lineTo(w * 0.42, h * 0.34)
          ..close();
        canvas.drawPath(suvWin, windowFill);
        canvas.drawPath(suvWin, lightStroke);
        final suvWin2 = Path()
          ..moveTo(w * 0.44, h * 0.34)
          ..lineTo(w * 0.44, h * 0.46)
          ..lineTo(w * 0.68, h * 0.46)
          ..lineTo(w * 0.62, h * 0.34)
          ..close();
        canvas.drawPath(suvWin2, windowFill);
        canvas.drawPath(suvWin2, lightStroke);
        break;
      case _VehicleSilhouetteType.pickup:
        body
          ..moveTo(w * 0.08, baseY)
          ..lineTo(w * 0.18, h * 0.46)
          ..lineTo(w * 0.34, h * 0.32)
          ..lineTo(w * 0.50, h * 0.32)
          ..lineTo(w * 0.56, h * 0.46)
          ..lineTo(w * 0.80, h * 0.46)
          ..lineTo(w * 0.80, h * 0.56)
          ..lineTo(w * 0.90, h * 0.56)
          ..lineTo(w * 0.92, baseY);
        // Cab window
        final pickWin = Path()
          ..moveTo(w * 0.35, h * 0.34)
          ..lineTo(w * 0.20, h * 0.46)
          ..lineTo(w * 0.49, h * 0.46)
          ..lineTo(w * 0.49, h * 0.34)
          ..close();
        canvas.drawPath(pickWin, windowFill);
        canvas.drawPath(pickWin, lightStroke);
        // Bed line
        canvas.drawLine(
          Offset(w * 0.58, h * 0.48),
          Offset(w * 0.78, h * 0.48),
          lightStroke,
        );
        break;
      case _VehicleSilhouetteType.van:
        body
          ..moveTo(w * 0.06, baseY)
          ..lineTo(w * 0.08, h * 0.36)
          ..lineTo(w * 0.28, h * 0.36)
          ..lineTo(w * 0.28, h * 0.36)
          ..lineTo(w * 0.70, h * 0.36)
          ..lineTo(w * 0.82, h * 0.48)
          ..lineTo(w * 0.92, h * 0.56)
          ..lineTo(w * 0.94, baseY);
        // Side windows
        final vanWin1 = Path()
          ..moveTo(w * 0.10, h * 0.38)
          ..lineTo(w * 0.10, h * 0.50)
          ..lineTo(w * 0.24, h * 0.50)
          ..lineTo(w * 0.24, h * 0.38)
          ..close();
        canvas.drawPath(vanWin1, windowFill);
        canvas.drawPath(vanWin1, lightStroke);
        final vanWin2 = Path()
          ..moveTo(w * 0.28, h * 0.38)
          ..lineTo(w * 0.28, h * 0.50)
          ..lineTo(w * 0.42, h * 0.50)
          ..lineTo(w * 0.42, h * 0.38)
          ..close();
        canvas.drawPath(vanWin2, windowFill);
        canvas.drawPath(vanWin2, lightStroke);
        // Windshield
        final vanWs = Path()
          ..moveTo(w * 0.72, h * 0.38)
          ..lineTo(w * 0.72, h * 0.50)
          ..lineTo(w * 0.82, h * 0.50)
          ..lineTo(w * 0.78, h * 0.38)
          ..close();
        canvas.drawPath(vanWs, windowFill);
        canvas.drawPath(vanWs, lightStroke);
        break;
    }

    // Draw body outline
    canvas.drawPath(body, stroke);
    // Ground line
    canvas.drawLine(Offset(w * 0.06, baseY), Offset(w * 0.94, baseY), stroke);
    // Wheels with hub detail
    final wheelStroke = Paint()
      ..color = const Color(0xFF334155)
      ..strokeWidth = w * 0.022
      ..style = PaintingStyle.stroke;
    final hubStroke = Paint()
      ..color = const Color(0xFF94A3B8)
      ..strokeWidth = w * 0.012
      ..style = PaintingStyle.stroke;
    canvas.drawCircle(Offset(leftWheelX, baseY), wheelR, wheelStroke);
    canvas.drawCircle(Offset(leftWheelX, baseY), wheelR * 0.4, hubStroke);
    canvas.drawCircle(Offset(rightWheelX, baseY), wheelR, wheelStroke);
    canvas.drawCircle(Offset(rightWheelX, baseY), wheelR * 0.4, hubStroke);

    // Repair annotation — clean accent pointer
    final anchor = _repairAnchor(size, leftWheelX, rightWheelX, baseY);
    final tag = Offset(w * 0.50, h * 0.16);
    // Pointer line
    canvas.drawLine(anchor, tag, accent);
    // Anchor circle
    canvas.drawCircle(anchor, w * 0.030, accent);
    // Tag dot
    canvas.drawCircle(
        tag, w * 0.016, accent..style = PaintingStyle.fill);
    accent.style = PaintingStyle.stroke;

    // Small crosshair at top-left
    canvas.drawLine(
      Offset(w * 0.12, h * 0.14),
      Offset(w * 0.18, h * 0.14),
      lightStroke,
    );
    canvas.drawLine(
      Offset(w * 0.15, h * 0.11),
      Offset(w * 0.15, h * 0.17),
      lightStroke,
    );
  }

  Offset _repairAnchor(
      Size size, double leftWX, double rightWX, double baseY) {
    final w = size.width;
    final h = size.height;
    switch (repairType) {
      case _RepairVisualType.brakes:
        return Offset(rightWX, baseY);
      case _RepairVisualType.oil:
      case _RepairVisualType.filter:
        return Offset(w * 0.46, baseY - h * 0.08);
      case _RepairVisualType.turbo:
      case _RepairVisualType.engine:
        return Offset(w * 0.40, h * 0.48);
      case _RepairVisualType.battery:
        return Offset(w * 0.32, h * 0.44);
      case _RepairVisualType.cooling:
        return Offset(w * 0.82, h * 0.52);
      case _RepairVisualType.suspension:
        return Offset(leftWX, baseY - h * 0.10);
      case _RepairVisualType.generic:
        return Offset(w * 0.48, h * 0.50);
    }
  }

  @override
  bool shouldRepaint(covariant _VehicleIllustrationPainter oldDelegate) {
    return oldDelegate.silhouette != silhouette ||
        oldDelegate.repairType != repairType;
  }
}

_RepairVisualType _classifyRepair(String label) {
  final text = label.toLowerCase();
  if (text.contains('brake') ||
      text.contains('гальм') ||
      text.contains('спирач') ||
      text.contains('колодк')) {
    return _RepairVisualType.brakes;
  }
  if (text.contains('turbo') || text.contains('турбо')) {
    return _RepairVisualType.turbo;
  }
  if (text.contains('battery') ||
      text.contains('акум') ||
      text.contains('батер')) {
    return _RepairVisualType.battery;
  }
  if (text.contains('filter') ||
      text.contains('фільтр') ||
      text.contains('филт')) {
    return _RepairVisualType.filter;
  }
  if (text.contains('cool') ||
      text.contains('охолод') ||
      text.contains('охлаж')) {
    return _RepairVisualType.cooling;
  }
  if (text.contains('suspension') ||
      text.contains('shock') ||
      text.contains('підвіс') ||
      text.contains('окач')) {
    return _RepairVisualType.suspension;
  }
  if (text.contains('oil') ||
      text.contains('олив') ||
      text.contains('маст') ||
      text.contains('масл')) {
    return _RepairVisualType.oil;
  }
  if (text.contains('engine') || text.contains('двиг')) {
    return _RepairVisualType.engine;
  }
  return _RepairVisualType.generic;
}

_VehicleSilhouetteType _classifyVehicle(String model) {
  final text = model.toLowerCase();
  if (RegExp(r'van|transit|sprinter|metris|promaster|express|savana|caravan|sienna|odyssey|pacifica|carnival|staria|transporter|crafter|vito|ducato|bus').hasMatch(text)) {
    return _VehicleSilhouetteType.van;
  }
  if (RegExp(r'pickup|hilux|ranger|f-150|f150|silverado|ram|tundra|tacoma|colorado|frontier|titan|ridgeline|maverick|gladiator|navara|amarok|l200|triton').hasMatch(text)) {
    return _VehicleSilhouetteType.pickup;
  }
  if (RegExp(r'suv|land cruiser|cruiser|4runner|rav4|qashqai|x[357]|tucson|sportage|cx-|tiguan|escape|explorer|cherokee|wrangler|outlander|forester|pilot|highlander|tahoe|suburban|blazer|bronco|defender|range rover|discovery|cayenne|q[357]|gl[cse]|xc[469]0|yaris cross').hasMatch(text)) {
    return _VehicleSilhouetteType.suv;
  }
  return _VehicleSilhouetteType.sedan;
}
