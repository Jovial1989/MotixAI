// ── Auth ──────────────────────────────────────────────────────────────────────

class AuthUser {
  final String id;
  final String email;
  final String role;
  final String? tenantId;

  const AuthUser({required this.id, required this.email, required this.role, this.tenantId});

  factory AuthUser.fromJson(Map<String, dynamic> j) => AuthUser(
    id: j['id'] as String,
    email: j['email'] as String,
    role: j['role'] as String,
    tenantId: j['tenantId'] as String?,
  );
}

class AuthTokens {
  final String accessToken;
  final String? refreshToken;
  final AuthUser user;

  const AuthTokens({required this.accessToken, this.refreshToken, required this.user});

  factory AuthTokens.fromJson(Map<String, dynamic> j) => AuthTokens(
    accessToken: j['accessToken'] as String,
    refreshToken: j['refreshToken'] as String?,
    user: AuthUser.fromJson(j['user'] as Map<String, dynamic>),
  );
}

// ── Guide ─────────────────────────────────────────────────────────────────────

// Multi-phase illustration pipeline statuses.
// The backend progresses through: queued → searching_refs → analyzing_refs → generating → ready | failed
enum ImageStatus { none, queued, searchingRefs, analyzingRefs, generating, ready, failed }

ImageStatus _parseImageStatus(String? s) => switch (s) {
  'queued'          => ImageStatus.queued,
  'searching_refs'  => ImageStatus.searchingRefs,
  'analyzing_refs'  => ImageStatus.analyzingRefs,
  'generating'      => ImageStatus.generating,
  'ready'           => ImageStatus.ready,
  'failed'          => ImageStatus.failed,
  _                 => ImageStatus.none,
};

class RepairStep {
  final String id;
  final int stepOrder;
  final String title;
  final String instruction;
  final String? torqueValue;
  final String? warningNote;
  final ImageStatus imageStatus;
  final String? imageUrl;
  final String? imageError;

  const RepairStep({
    required this.id,
    required this.stepOrder,
    required this.title,
    required this.instruction,
    this.torqueValue,
    this.warningNote,
    required this.imageStatus,
    this.imageUrl,
    this.imageError,
  });

  factory RepairStep.fromJson(Map<String, dynamic> j) => RepairStep(
    id: j['id'] as String,
    stepOrder: j['stepOrder'] as int,
    title: j['title'] as String,
    instruction: j['instruction'] as String,
    torqueValue: j['torqueValue'] as String?,
    warningNote: j['warningNote'] as String?,
    imageStatus: _parseImageStatus(j['imageStatus'] as String?),
    imageUrl: j['imageUrl'] as String?,
    imageError: j['imageError'] as String?,
  );

  RepairStep copyWith({ImageStatus? imageStatus, String? imageUrl}) => RepairStep(
    id: id, stepOrder: stepOrder, title: title, instruction: instruction,
    torqueValue: torqueValue, warningNote: warningNote,
    imageStatus: imageStatus ?? this.imageStatus,
    imageUrl: imageUrl ?? this.imageUrl,
    imageError: imageError,
  );

  bool get isPending =>
      imageStatus == ImageStatus.queued ||
      imageStatus == ImageStatus.searchingRefs ||
      imageStatus == ImageStatus.analyzingRefs ||
      imageStatus == ImageStatus.generating;
}

class Vehicle {
  final String id;
  final String model;
  const Vehicle({required this.id, required this.model});
  factory Vehicle.fromJson(Map<String, dynamic> j) =>
      Vehicle(id: j['id'] as String, model: j['model'] as String);
}

class Part {
  final String id;
  final String name;
  const Part({required this.id, required this.name});
  factory Part.fromJson(Map<String, dynamic> j) =>
      Part(id: j['id'] as String, name: j['name'] as String);
}

class RepairGuide {
  final String id;
  final String title;
  final String difficulty;
  final String timeEstimate;
  final List<String> tools;
  final List<String> safetyNotes;
  final String sourceType;
  final String createdAt;
  final Vehicle vehicle;
  final Part part;
  final List<RepairStep> steps;

  const RepairGuide({
    required this.id,
    required this.title,
    required this.difficulty,
    required this.timeEstimate,
    required this.tools,
    required this.safetyNotes,
    required this.sourceType,
    required this.createdAt,
    required this.vehicle,
    required this.part,
    required this.steps,
  });

  factory RepairGuide.fromJson(Map<String, dynamic> j) => RepairGuide(
    id: j['id'] as String,
    title: j['title'] as String,
    difficulty: j['difficulty'] as String,
    timeEstimate: j['timeEstimate'] as String,
    tools: (j['tools'] as List<dynamic>).cast<String>(),
    safetyNotes: (j['safetyNotes'] as List<dynamic>).cast<String>(),
    sourceType: j['sourceType'] as String,
    createdAt: j['createdAt'] as String,
    vehicle: Vehicle.fromJson(j['vehicle'] as Map<String, dynamic>),
    part: Part.fromJson(j['part'] as Map<String, dynamic>),
    steps: (j['steps'] as List<dynamic>)
        .map((s) => RepairStep.fromJson(s as Map<String, dynamic>))
        .toList()
        ..sort((a, b) => a.stepOrder.compareTo(b.stepOrder)),
  );

  Map<String, dynamic> toJson() => {
    'id': id, 'title': title, 'difficulty': difficulty,
    'timeEstimate': timeEstimate, 'tools': tools, 'safetyNotes': safetyNotes,
    'sourceType': sourceType, 'createdAt': createdAt,
    'vehicle': {'id': vehicle.id, 'model': vehicle.model},
    'part': {'id': part.id, 'name': part.name},
    'steps': steps.map((s) => {
      'id': s.id, 'stepOrder': s.stepOrder, 'title': s.title,
      'instruction': s.instruction, 'torqueValue': s.torqueValue,
      'warningNote': s.warningNote, 'imageStatus': s.imageStatus.name,
      'imageUrl': s.imageUrl, 'imageError': s.imageError,
    }).toList(),
  };

  bool get hasInProgress => steps.any((s) => s.isPending);

  RepairGuide withUpdatedStep(RepairStep updated) => RepairGuide(
    id: id, title: title, difficulty: difficulty, timeEstimate: timeEstimate,
    tools: tools, safetyNotes: safetyNotes, sourceType: sourceType,
    createdAt: createdAt, vehicle: vehicle, part: part,
    steps: steps.map((s) => s.id == updated.id ? updated : s).toList(),
  );
}
