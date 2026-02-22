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

The AI Ready Studio project is built using Capacitor, which allows for easy deployment to native mobile platforms like Android. To generate an Android Application Package (APK) for testing, follow these steps:

### Prerequisites

*   **Node.js and npm/pnpm:** Ensure you have these installed.
*   **Android Studio:** Install Android Studio, which includes the Android SDK and necessary command-line tools. Set up your `ANDROID_HOME` environment variable.
*   **Java Development Kit (JDK):** JDK 11 or higher is required.

### Steps to Generate APK

1.  **Navigate to Project Directory:**
    Open your terminal or command prompt and navigate to the root of your `ai-ready-studio` project:

    ```bash
    cd /home/ubuntu/ai-ready-studio
    ```

2.  **Install Dependencies:**
    If you haven't already, install the project's dependencies:

    ```bash
    pnpm install
    ```

3.  **Build Web Assets:**
    Capacitor wraps your web application. First, you need to build the web project for production:

    ```bash
    pnpm run build
    ```

    This command will create a `dist` directory containing your optimized web assets.

4.  **Add Android Platform (if not already added):**
    If the Android platform has not been added to your Capacitor project, add it now:

    ```bash
    pnpm cap add android
    ```

5.  **Sync Capacitor Project:**
    This command copies your web assets into the Android project and updates Capacitor's native dependencies:

    ```bash
    pnpm cap sync
    ```

6.  **Open Android Studio:**
    Open the Android project in Android Studio:

    ```bash
    pnpm cap open android
    ```

    Android Studio will launch and open the `android` directory of your project. It might take some time to sync Gradle and download necessary components.

7.  **Generate Signed APK/Bundle:**
    Once Android Studio is ready:
    *   Go to `Build` > `Generate Signed Bundle / APK...`.
    *   Select `Android App Bundle` or `APK`. For testing, `APK` is simpler.
    *   Click `Next`.
    *   **Keystore path:** If you have an existing keystore, use it. Otherwise, click `Create new...` to generate a new one. Remember to keep your keystore file and password safe.
    *   Fill in the alias, password, and validity information for your key.
    *   Click `Next`.
    *   Select `debug` for testing purposes. For a release build, select `release`.
    *   Check `V1 (Jar Signature)` and `V2 (Full APK Signature)` for signature versions.
    *   Click `Finish`.

    Android Studio will build the APK. Once complete, a notification will appear with a link to locate the generated APK file (usually in `android/app/build/outputs/apk/debug/`).

This APK file can then be installed on your Android device for testing.
