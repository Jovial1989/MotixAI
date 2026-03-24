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
    this.width = 120,
    this.height = 92,
    this.padding = const EdgeInsets.all(10),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      padding: padding,
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
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
    final stroke = Paint()
      ..color = const Color(0xFF1F2937)
      ..strokeWidth = size.width * 0.024
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final guide = Paint()
      ..color = const Color(0xFFCBD5E1)
      ..strokeWidth = size.width * 0.018
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final accent = Paint()
      ..color = kPrimary
      ..strokeWidth = size.width * 0.022
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final baseY = size.height * 0.72;
    final leftWheel = Offset(size.width * 0.28, baseY);
    final rightWheel = Offset(size.width * 0.72, baseY);
    final wheelRadius = size.width * 0.12;

    final body = Path();
    switch (silhouette) {
      case _VehicleSilhouetteType.pickup:
        body
          ..moveTo(size.width * 0.12, baseY)
          ..lineTo(size.width * 0.22, size.height * 0.48)
          ..lineTo(size.width * 0.50, size.height * 0.48)
          ..lineTo(size.width * 0.60, size.height * 0.38)
          ..lineTo(size.width * 0.78, size.height * 0.38)
          ..lineTo(size.width * 0.78, size.height * 0.58)
          ..lineTo(size.width * 0.88, size.height * 0.58)
          ..lineTo(size.width * 0.88, baseY);
        break;
      case _VehicleSilhouetteType.van:
        body
          ..moveTo(size.width * 0.10, baseY)
          ..lineTo(size.width * 0.18, size.height * 0.44)
          ..lineTo(size.width * 0.68, size.height * 0.44)
          ..lineTo(size.width * 0.82, size.height * 0.52)
          ..lineTo(size.width * 0.88, baseY);
        break;
      case _VehicleSilhouetteType.suv:
        body
          ..moveTo(size.width * 0.10, baseY)
          ..lineTo(size.width * 0.18, size.height * 0.50)
          ..lineTo(size.width * 0.34, size.height * 0.40)
          ..lineTo(size.width * 0.56, size.height * 0.40)
          ..lineTo(size.width * 0.74, size.height * 0.50)
          ..lineTo(size.width * 0.88, size.height * 0.58)
          ..lineTo(size.width * 0.92, baseY);
        break;
      case _VehicleSilhouetteType.sedan:
        body
          ..moveTo(size.width * 0.12, baseY)
          ..lineTo(size.width * 0.22, size.height * 0.52)
          ..lineTo(size.width * 0.40, size.height * 0.42)
          ..lineTo(size.width * 0.60, size.height * 0.42)
          ..lineTo(size.width * 0.75, size.height * 0.54)
          ..lineTo(size.width * 0.88, size.height * 0.58)
          ..lineTo(size.width * 0.90, baseY);
        break;
    }

    canvas.drawPath(body, stroke);
    canvas.drawLine(
      Offset(size.width * 0.12, baseY),
      Offset(size.width * 0.92, baseY),
      stroke,
    );
    canvas.drawCircle(leftWheel, wheelRadius, stroke);
    canvas.drawCircle(rightWheel, wheelRadius, stroke);

    canvas.drawLine(
      Offset(size.width * 0.74, size.height * 0.22),
      Offset(size.width * 0.92, size.height * 0.22),
      guide,
    );
    canvas.drawLine(
      Offset(size.width * 0.74, size.height * 0.30),
      Offset(size.width * 0.90, size.height * 0.30),
      guide,
    );
    canvas.drawCircle(
      Offset(size.width * 0.70, size.height * 0.22),
      size.width * 0.02,
      accent..style = PaintingStyle.fill,
    );
    accent.style = PaintingStyle.stroke;

    final anchor = _repairAnchor(size, leftWheel, rightWheel, baseY);
    final target = Offset(size.width * 0.54, size.height * 0.18);
    canvas.drawCircle(anchor, size.width * 0.036, accent);
    canvas.drawLine(anchor, target, accent);
    canvas.drawCircle(
        target, size.width * 0.018, accent..style = PaintingStyle.fill);
    accent.style = PaintingStyle.stroke;

    canvas.drawLine(
      Offset(size.width * 0.18, size.height * 0.18),
      Offset(size.width * 0.22, size.height * 0.26),
      accent,
    );
    canvas.drawLine(
      Offset(size.width * 0.22, size.height * 0.18),
      Offset(size.width * 0.18, size.height * 0.26),
      accent,
    );
  }

  Offset _repairAnchor(
      Size size, Offset leftWheel, Offset rightWheel, double baseY) {
    switch (repairType) {
      case _RepairVisualType.brakes:
        return Offset(rightWheel.dx, rightWheel.dy);
      case _RepairVisualType.oil:
      case _RepairVisualType.filter:
        return Offset(size.width * 0.48, baseY - size.height * 0.06);
      case _RepairVisualType.turbo:
      case _RepairVisualType.battery:
      case _RepairVisualType.engine:
      case _RepairVisualType.cooling:
        return Offset(size.width * 0.42, size.height * 0.50);
      case _RepairVisualType.suspension:
        return Offset(leftWheel.dx, leftWheel.dy - size.height * 0.08);
      case _RepairVisualType.generic:
        return Offset(size.width * 0.48, size.height * 0.52);
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
      text.contains('спирач')) {
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
  if (text.contains('oil') || text.contains('маст') || text.contains('масл')) {
    return _RepairVisualType.oil;
  }
  if (text.contains('engine') || text.contains('двиг')) {
    return _RepairVisualType.engine;
  }
  return _RepairVisualType.generic;
}

_VehicleSilhouetteType _classifyVehicle(String model) {
  final text = model.toLowerCase();
  if (text.contains('van') ||
      text.contains('transit') ||
      text.contains('sprinter') ||
      text.contains('bus')) {
    return _VehicleSilhouetteType.van;
  }
  if (text.contains('pickup') ||
      text.contains('hilux') ||
      text.contains('ranger') ||
      text.contains('f-150')) {
    return _VehicleSilhouetteType.pickup;
  }
  if (text.contains('suv') ||
      text.contains('cruiser') ||
      text.contains('qashqai') ||
      text.contains('rav4') ||
      text.contains('x5') ||
      text.contains('yaris cross')) {
    return _VehicleSilhouetteType.suv;
  }
  return _VehicleSilhouetteType.sedan;
}
