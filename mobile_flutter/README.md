# MotixAI Flutter Client

Flutter mobile client for the MotixAI repair guide platform. Mirrors the core experience of the web and React Native apps using a native Flutter stack.

## Stack

| Package | Purpose |
|---------|---------|
| `flutter_riverpod` 2.x | State management (StateNotifierProvider) |
| `dio` 5.x | HTTP client with auth interceptor + silent refresh |
| `go_router` 13.x | Declarative file-based routing with auth redirect |
| `flutter_secure_storage` | Token persistence (access + refresh) |
| `shared_preferences` | Guide list cache (max 10 entries) |
| `photo_view` | Full-screen step image viewer |

## Project Structure

```
lib/
  main.dart                          # Entry point
  app/
    app.dart                         # MaterialApp.router
    router.dart                      # GoRouter + auth redirect
    theme.dart                       # Design system (colors, spacing, text styles)
  shared/
    api/
      api_client.dart                # Dio client + auth interceptor
      providers.dart                 # Riverpod providers for API & storage
    models/
      models.dart                    # RepairGuide, RepairStep, AuthUser, etc.
    storage/
      token_store.dart               # flutter_secure_storage wrapper
      cache_store.dart               # SharedPreferences guide cache
    widgets/
      mx_widgets.dart                # Reusable UI components (MxChip, MxSkeleton…)
  features/
    auth/
      auth_provider.dart             # AuthState + AuthNotifier (login/signup/logout)
      presentation/
        splash_screen.dart           # Bootstrap screen — loads tokens, redirects
        login_screen.dart            # Email + password login
        signup_screen.dart           # Account creation
    guides/
      guides_provider.dart           # GuidesNotifier + GuideDetailNotifier
      presentation/
        dashboard_screen.dart        # Guide list + AI query bar
        guide_detail_screen.dart     # Step-by-step viewer with image polling
        history_screen.dart          # Read-only guide history
    profile/
      presentation/
        profile_screen.dart          # User info + sign out
```

## Getting Started

### 1. Install Flutter

Requires Flutter ≥ 3.19 (Dart ≥ 3.3). Verify with:

```bash
flutter doctor
```

### 2. Install dependencies

```bash
cd mobile_flutter
flutter pub get
```

### 3. Configure API URL

The API base URL is passed at compile time via `--dart-define`:

```bash
# iOS simulator
flutter run --dart-define=API_BASE_URL=http://localhost:4000

# Android emulator
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000

# Physical device (use your machine's local IP)
flutter run --dart-define=API_BASE_URL=http://192.168.1.x:4000
```

### 4. Run

```bash
# List available devices
flutter devices

# Run on a specific device
flutter run -d <device-id> --dart-define=API_BASE_URL=http://localhost:4000
```

## Design System

All design tokens live in `lib/app/theme.dart`:

- **Colors**: `kPrimary` (orange-600), `kBg` (slate-100), `kText`, `kTextSub`, `kTextMuted`, semantic success/warning/error
- **Spacing**: 8pt grid — `s4`, `s8`, `s10`, `s12`, `s14`, `s16`, `s24`, `s32`, `s48`
- **Radius**: `kRadiusSm` (10), `kRadiusMd` (14), `kRadiusLg` (20), `kRadiusFull` (999)
- **Text styles**: `tsStepTitle` (26/700), `tsSectionHead` (18/700), `tsTitle` (24/700), `tsSubhead` (15/600), `tsBody` (16/400), `tsCaption` (13/500), `tsLabel` (11/700)

## Auth Flow

1. App boots → `SplashScreen` calls `authProvider.notifier.bootstrap()`
2. Bootstrap loads tokens from `flutter_secure_storage`, decodes JWT claims, returns `hasSession` or `noSession`
3. GoRouter redirects to `/dashboard` or `/login` accordingly
4. On 401, Dio interceptor silently refreshes the access token using the refresh token
5. On refresh failure, tokens are cleared and the user is sent back to `/login`

## Image Generation

Step images are generated asynchronously:
1. On guide load, steps with `imageStatus == none` trigger `POST /steps/:id/generate-image`
2. While any step has `imageStatus == queued|generating`, the detail screen polls every 4 seconds
3. Failed images show a retry button that calls `generate-image` with `force: true`
4. Ready images open in a full-screen `photo_view` modal on tap

## Building for Production

```bash
# iOS (requires Xcode + Apple developer account)
flutter build ios --dart-define=API_BASE_URL=https://your-api.com

# Android APK
flutter build apk --dart-define=API_BASE_URL=https://your-api.com

# Android App Bundle (Play Store)
flutter build appbundle --dart-define=API_BASE_URL=https://your-api.com
```
