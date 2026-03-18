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

The API base URL is passed at compile time via `--dart-define`.
Copy `dart_defines.env.example` → `dart_defines.env` and set the value:

```bash
cp dart_defines.env.example dart_defines.env
# Edit dart_defines.env and set API_BASE_URL
```

**Production (Supabase — recommended for simulator too):**
```bash
flutter run --dart-define=API_BASE_URL=https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/api
```

**Local NestJS dev server:**
```bash
# iOS simulator — use your machine's IP, NOT localhost (simulator can't reach localhost:4000)
flutter run --dart-define=API_BASE_URL=http://192.168.1.x:4000/api/v1

# Android emulator
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api/v1
```

> **Note:** iOS Simulator cannot reach `http://localhost:4000` — the simulator runs in its own
> network namespace. Use your machine's LAN IP or point directly at the Supabase endpoint.

### 4. Run

```bash
# List available devices
flutter devices

# Run on iOS simulator (production API)
flutter run -d ios --dart-define=API_BASE_URL=https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/api

# Run on Android emulator (production API)
flutter run -d android --dart-define=API_BASE_URL=https://hxzpbvgwujuisxheykcr.supabase.co/functions/v1/api
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

## Environment Configuration

All runtime configuration is passed at **compile time** via `--dart-define`. No `.env` file is used — configure values in CI secrets or pass directly on the CLI.

| Variable | Required | Example |
|----------|----------|---------|
| `API_BASE_URL` | Yes | `https://xyz.supabase.co/functions/v1/api` |

See `dart_defines.env.example` for the full list and documentation.

## Building for Production

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Flutter | 3.19.0 |
| Xcode | 15.0 (iOS) |
| Android Studio / Java | JDK 17 (Android) |
| Apple developer account | Required for iOS distribution |
| Google Play account | Required for Android distribution |

Set your production `API_BASE_URL` (Supabase Edge Functions endpoint):

```bash
export PROD_API=https://<your-project-ref>.supabase.co/functions/v1/api
```

---

### iOS

#### 1. Install dependencies

```bash
cd mobile_flutter
flutter pub get
cd ios && pod install && cd ..
```

#### 2. Configure signing in Xcode

Open `ios/Runner.xcworkspace` in Xcode, select the **Runner** target, and under **Signing & Capabilities**:
- Set your **Team** (Apple developer account)
- Bundle ID is already set to `com.motixai.app` — change if needed

#### 3. Build IPA for distribution

```bash
flutter build ipa \
  --dart-define=API_BASE_URL=$PROD_API \
  --release
```

The `.ipa` file will be at `build/ios/ipa/motixai_flutter.ipa`.

To upload to App Store Connect:
```bash
xcrun altool --upload-app -f build/ios/ipa/motixai_flutter.ipa \
  -u your@apple.id -p "@keychain:APP_STORE_CONNECT_PASSWORD"
```
Or drag the `.ipa` into **Transporter**.

---

### Android

#### 1. Create a signing keystore (first time only)

```bash
keytool -genkey -v -keystore android/app/motixai-release.jks \
  -alias motixai -keyalg RSA -keysize 2048 -validity 10000
```

**Keep `motixai-release.jks` out of version control** (it is already in `.gitignore`).

#### 2. Configure signing

Create `android/key.properties` (do not commit this file):

```properties
storePassword=<your-keystore-password>
keyPassword=<your-key-password>
keyAlias=motixai
storeFile=motixai-release.jks
```

Then update `android/app/build.gradle.kts` to load `key.properties` for the release signing config before publishing to the Play Store.

#### 3. Build APK (direct install / testing)

```bash
flutter build apk \
  --dart-define=API_BASE_URL=$PROD_API \
  --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

#### 4. Build App Bundle (Google Play)

```bash
flutter build appbundle \
  --dart-define=API_BASE_URL=$PROD_API \
  --release
```

Output: `build/app/outputs/bundle/release/app-release.aab`

Upload `app-release.aab` to the Google Play Console.

---

### Version bumping

Version is set in `pubspec.yaml` as `version: <semver>+<buildNumber>`.

```bash
# Example: bump to 1.1.0, build 2
# Edit pubspec.yaml:  version: 1.1.0+2
# Then rebuild — flutter reads versionName/versionCode from pubspec automatically
```

---

### App Icons

The current icons are Flutter defaults. To replace them with branded MotixAI icons:

1. Add `flutter_launcher_icons` to `dev_dependencies` in `pubspec.yaml`
2. Place a 1024×1024 PNG at `assets/icon/icon.png`
3. Add the config:
   ```yaml
   flutter_launcher_icons:
     android: true
     ios: true
     image_path: "assets/icon/icon.png"
   ```
4. Run: `dart run flutter_launcher_icons`
