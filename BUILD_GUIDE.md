# AI-Ready Studio - Build Guide

This document provides instructions for building the AI-Ready Studio application for different platforms (Android APK, Windows MSIX, and iOS TestFlight).

## Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0
- Capacitor CLI: `npm install -g @capacitor/cli`
- Platform-specific requirements (see below)

## Build Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Web Assets

```bash
npm run build
```

This creates the optimized web build in the `dist/` directory.

### 3. Sync Capacitor

```bash
npx cap sync
```

This copies the web assets to the native platforms.

---

## Platform-Specific Builds

### Android (APK)

#### Prerequisites
- Android Studio installed
- Android SDK (API level 24+)
- Java Development Kit (JDK) 11+

#### Build Steps

1. **Sync Capacitor:**
   ```bash
   npx cap sync android
   ```

2. **Open Android Studio:**
   ```bash
   npx cap open android
   ```

3. **Build APK:**
   - In Android Studio: `Build → Build Bundle(s) / APK(s) → Build APK(s)`
   - Or via command line:
     ```bash
     cd android
     ./gradlew assembleRelease
     ```

4. **Signed APK (for distribution):**
   - Create a keystore file (if not already created):
     ```bash
     keytool -genkey -v -keystore release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias aiready
     ```
   - In Android Studio: `Build → Generate Signed Bundle / APK`
   - Select the keystore file and follow the prompts

5. **Output Location:**
   - Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
   - Release APK: `android/app/build/outputs/apk/release/app-release.apk`

#### Testing the APK
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Windows (MSIX)

#### Prerequisites
- Windows 10/11
- Visual Studio 2022 with UWP development tools
- Windows App SDK

#### Build Steps

1. **Sync Capacitor:**
   ```bash
   npx cap sync electron
   ```

2. **Open Visual Studio:**
   ```bash
   npx cap open electron
   ```

3. **Build MSIX:**
   - In Visual Studio: `Build → Build Solution`
   - Or via command line:
     ```bash
     cd electron
     npm run build
     ```

4. **Create MSIX Package:**
   - Use Windows App Packaging Project
   - Or use MakeAppx tool:
     ```bash
     MakeAppx pack /d "output_folder" /p "app.msix"
     ```

5. **Output Location:**
   - MSIX file: `electron/dist/I Am AI Ready.msix`

#### Testing the MSIX
```bash
Add-AppxPackage -Path "path\to\app.msix"
```

---

### iOS (TestFlight)

#### Prerequisites
- macOS with Xcode installed
- Apple Developer Account
- Provisioning profiles and certificates
- iOS deployment target: 14.0+

#### Build Steps

1. **Sync Capacitor:**
   ```bash
   npx cap sync ios
   ```

2. **Open Xcode:**
   ```bash
   npx cap open ios
   ```

3. **Configure Signing:**
   - Select project in Xcode
   - Go to `Signing & Capabilities`
   - Select your team and provisioning profile

4. **Build for Archive:**
   - Select `Generic iOS Device` as build target
   - `Product → Archive`

5. **Upload to App Store Connect:**
   - In Xcode Organizer: Select the archive → `Distribute App`
   - Choose `App Store Connect`
   - Follow the upload wizard

6. **Submit to TestFlight:**
   - Go to App Store Connect
   - Select the build
   - Add testers and submit for review

#### Testing Locally
```bash
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug -derivedDataPath build
```

---

## Environment Configuration

Before building, ensure the `.env` file is properly configured:

```bash
cp .env.example .env
```

Update the following variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_CLIENT_ID` (if using Google OAuth)
- `VITE_LINKEDIN_CLIENT_ID` (if using LinkedIn OAuth)
- `VITE_TUTORIAL_VIDEO_URL` (optional)

---

## Build Optimization

### Web Build
```bash
npm run build
# Output: dist/
# Size: ~2-3 MB (gzipped)
```

### Development Build
```bash
npm run build:dev
# Includes source maps for debugging
```

---

## Troubleshooting

### Android Build Issues
- **Gradle sync fails:** Run `./gradlew clean` in the android directory
- **Permission errors:** Ensure Android SDK is properly installed
- **APK too large:** Enable ProGuard/R8 minification in `android/app/build.gradle`

### Windows Build Issues
- **Visual Studio not found:** Ensure Visual Studio 2022 is installed with UWP tools
- **MSIX creation fails:** Check Windows App SDK version compatibility

### iOS Build Issues
- **Provisioning profile error:** Update in Xcode → Signing & Capabilities
- **Pod dependency errors:** Run `pod update` in the ios/App directory
- **Build fails on M1 Mac:** Ensure Xcode is running in native mode (not Rosetta)

---

## Release Checklist

Before releasing to production:

- [ ] Update version number in `capacitor.config.ts` and `package.json`
- [ ] Update `CHANGELOG.md` with new features and fixes
- [ ] Test on real devices (Android, iOS, Windows)
- [ ] Verify all features work correctly
- [ ] Check performance and battery usage
- [ ] Review privacy policy and terms of service
- [ ] Prepare app store descriptions and screenshots
- [ ] Test offline functionality
- [ ] Verify moderation system is working
- [ ] Test calendar export feature
- [ ] Verify video recording and playback

---

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Build Documentation](https://developer.android.com/build)
- [Windows App Development](https://docs.microsoft.com/en-us/windows/apps/)
- [iOS App Development](https://developer.apple.com/ios/)

---

## Support

For build issues or questions, refer to:
- Capacitor Community: https://github.com/ionic-team/capacitor
- DS Consortium Support: support@dsconsortium.org
