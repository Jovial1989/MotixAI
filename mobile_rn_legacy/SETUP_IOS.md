# iOS Development Setup (iPhone Simulator)

## Prerequisites

### 1. Install Xcode

```bash
# Install from Mac App Store or:
xcode-select --install

# After install, accept license:
sudo xcodebuild -license accept
```

Open **Xcode → Settings → Platforms** and download the latest **iOS Simulator** runtime.

### 2. Install Node.js & Yarn

```bash
# Using Homebrew:
brew install node
npm install -g yarn
```

### 3. Install Expo CLI & EAS CLI

```bash
npm install -g expo-cli eas-cli
```

### 4. Install Watchman (recommended for file watching)

```bash
brew install watchman
```

---

## VS Code Setup

### Required Extensions

Open the project in VS Code — it will prompt you to install recommended extensions automatically (`.vscode/extensions.json`). Key extensions:

| Extension | Purpose |
|-----------|---------|
| **Expo Tools** (`expo.vscode-expo-tools`) | Autocomplete for app.json, EAS config, inline Expo docs |
| **React Native Tools** (`msjsdiag.vscode-react-native`) | Debugging, IntelliSense for RN |
| **ESLint** (`dbaeumer.vscode-eslint`) | Linting |
| **Prettier** (`esbenp.prettier-vscode`) | Formatting |
| **Prisma** (`prisma.prisma`) | Backend schema highlighting |
| **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) | Web workspace |

### Debugging in VS Code

1. Press `Cmd+Shift+P` → **"Expo: Start"** (from Expo Tools extension)
2. Or use the built-in terminal: `yarn workspace /mobile start`
3. Press `i` in the terminal to open iOS Simulator

---

## Running on iPhone Simulator

### Quick Start

```bash
# From the monorepo root:
yarn dev:mobile

# Or specifically for iOS:
yarn workspace /mobile ios
```

This will:
1. Start the Metro bundler
2. Launch the iOS Simulator
3. Install and open the Expo Go app

### Choose a Specific iPhone Model

```bash
# List available simulators:
xcrun simctl list devices available

# Start a specific device:
open -a Simulator --args -CurrentDeviceUDID <DEVICE_UDID>

# Then run:
yarn workspace /mobile start
# Press 'i' to connect to the running simulator
```

### Common iPhone Simulators

- iPhone 15 Pro
- iPhone 15 Pro Max
- iPhone SE (3rd generation)

---

## Running on a Physical iPhone

### Option A: Expo Go (fastest for development)

1. Install **Expo Go** from the App Store on your iPhone
2. Run `yarn dev:mobile` on your Mac
3. Scan the QR code with your iPhone camera
4. Make sure your Mac and iPhone are on the same Wi-Fi network

### Option B: Development Build (for native modules)

```bash
# Install EAS CLI if not already:
npm install -g eas-cli

# Login to Expo:
eas login

# Create a development build for iOS Simulator:
eas build --profile development --platform ios

# Or for a physical device:
eas build --profile development --platform ios --no-simulator
```

---

## Environment Variables

```bash
# Copy the example env file:
cp mobile/.env.example mobile/.env

# Edit to point to your local backend:
# API_URL=http://localhost:4000       (simulator)
# API_URL=http://192.168.x.x:4000    (physical device — use your Mac's LAN IP)
```

To find your Mac's LAN IP:
```bash
ipconfig getifaddr en0
```

---

## Troubleshooting

### Simulator won't start
```bash
# Reset all simulators:
xcrun simctl shutdown all
xcrun simctl erase all
```

### Metro bundler cache issues
```bash
# Clear Metro cache:
yarn workspace /mobile start --clear
```

### Pods / native dependencies
```bash
# If you eject or use development builds:
cd mobile/ios && pod install && cd ..
```

### Port conflicts
The backend runs on `:4000`, Metro bundler on `:8081`. If `:8081` is taken:
```bash
yarn workspace /mobile start --port 8082
```
