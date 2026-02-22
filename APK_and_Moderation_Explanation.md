# AI Ready Studio: Moderation and Android APK Generation Guide

## Understanding the Moderation Process

Previously, you observed that some videos were still in an "In Review" state despite the implementation of a moderation model. This section clarifies the two-tiered moderation process and why certain videos might require manual intervention.

### Two-Tiered Moderation System

The AI Ready Studio employs a two-tiered moderation system to ensure content compliance:

1.  **Client-Side Local Moderation (`moderateLocally`):** This is the first line of defense, executed directly within the user's browser before a video is even uploaded. It performs a quick check against a predefined list of blocked terms in the video's title and description. If any blocked terms are detected, the upload is immediately halted, and the user receives a notification that their content is not allowed. This prevents obviously inappropriate content from reaching the server.

2.  **Server-Side Edge Function Moderation (`moderate-video`):** After a video successfully passes the local moderation and is uploaded to Supabase Storage, an Edge Function (`moderate-video`) is invoked. This function performs a more robust, keyword-based blocklist check on the video's metadata. If the video passes this check, its `is_approved` status in the database is set to `true`, and it becomes visible in the gallery. If the Edge Function detects any potentially problematic content, it flags the video, setting `is_approved` to `false` and assigning a `moderation_status` of "in review." These videos then require manual review by an administrator.

### Why Videos Enter "In Review" Status

A video enters the "In Review" status when the server-side Edge Function moderation flags it. This means that while the video might have passed the initial client-side check, the more comprehensive server-side analysis identified keywords or patterns that warrant human oversight. The polling mechanism implemented ensures that videos that *pass* the Edge Function are approved almost instantly. Therefore, any video remaining in "In Review" status has been explicitly flagged by the server-side logic.

## Generating the Android APK

The AI Ready Studio project is built using Capacitor, which allows for easy deployment to native mobile platforms like Android.

> **Important:** This project requires **Node.js v22.0.0 or higher** (enforced by `@capacitor/cli@8.x`). Using an older version (e.g., v16 or v20) will cause installation and build failures. Always verify your Node.js version before proceeding.

### Option A: Automated APK via GitHub Actions (Recommended)

A GitHub Actions workflow (`.github/workflows/build-apk.yml`) is included in the repository. It automatically builds a debug APK on every push to `main` or on demand.

**To trigger a manual build:**

1. Go to your repository on GitHub.
2. Click the **Actions** tab.
3. Select **Build Android APK** from the left sidebar.
4. Click **Run workflow** → **Run workflow**.
5. Once the run completes, download the `app-debug.apk` artifact from the workflow summary page.

---

### Option B: Local Build

#### Prerequisites

*   **Node.js v22+**: Install via [nvm](https://github.com/nvm-sh/nvm) (recommended) or the [official installer](https://nodejs.org/). The project includes an `.nvmrc` file — run `nvm install && nvm use` to switch automatically.
*   **Android Studio:** Install Android Studio, which includes the Android SDK and necessary command-line tools. Set up your `ANDROID_HOME` environment variable.
*   **Java Development Kit (JDK) 17:** JDK 17 is required for the Gradle build.

#### Steps to Generate APK

1.  **Verify Node.js version:**

    ```bash
    node -v   # Must be v22.0.0 or higher
    ```

    If you use `nvm`, the project includes an `.nvmrc` file — simply run:

    ```bash
    nvm install   # installs the version specified in .nvmrc (22)
    nvm use       # switches to it
    ```

2.  **Navigate to Project Directory:**
    Open your terminal or command prompt and navigate to the root of your `ai-ready-studio` project:

    ```bash
    cd /path/to/ai-ready-studio
    ```

3.  **Install Dependencies:**
    If you haven't already, install the project's dependencies:

    ```bash
    npm install
    ```

4.  **Build Web Assets:**
    Capacitor wraps your web application. First, you need to build the web project for production:

    ```bash
    npm run build
    ```

    This command will create a `dist/` directory containing your optimized web assets.

5.  **Add Android Platform (first time only):**
    If the `android/` directory is not already present:

    ```bash
    npx cap add android
    ```

6.  **Sync Capacitor Project:**
    This command copies your web assets into the Android project and updates Capacitor's native dependencies:

    ```bash
    npx cap sync
    ```

7.  **Open Android Studio:**
    Open the Android project in Android Studio:

    ```bash
    npx cap open android
    ```

    Android Studio will launch and open the `android/` directory. Allow Gradle to sync and download necessary components.

8.  **Generate Signed APK/Bundle:**
    Once Android Studio is ready:
    *   Go to **Build** → **Generate Signed Bundle / APK...**
    *   Select **APK** (for testing) or **Android App Bundle** (for Play Store).
    *   Click **Next**.
    *   **Keystore path:** Use an existing keystore or click **Create new...** to generate one. Keep your keystore file and passwords safe.
    *   Fill in the alias, password, and validity information.
    *   Click **Next**.
    *   Select **debug** for testing or **release** for production.
    *   Check **V1 (Jar Signature)** and **V2 (Full APK Signature)**.
    *   Click **Finish**.

    The APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk` (debug) or the equivalent release path.

---

### Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `This version of pnpm requires at least Node.js v18.12` | Node.js version too old | Upgrade to Node.js v22 using `nvm install 22 && nvm use 22` |
| `[fatal] The Capacitor CLI requires NodeJS >=22.0.0` | Node.js version below 22 | Same as above |
| `"default" is not exported by "src/pages/Record.tsx"` | Missing default export in Record.tsx | Already fixed in the latest commit |
| `Error: Expected "0.25.0" but got "0.21.5"` (esbuild) | Stale `node_modules` from a previous Node version | Delete `node_modules` and `package-lock.json`, then re-run `npm install` |
| `vite: not found` | Dependencies not installed or install failed | Ensure Node.js v22+ is active, then re-run `npm install` |
