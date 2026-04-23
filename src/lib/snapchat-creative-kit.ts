/**
 * snapchat-creative-kit.ts
 *
 * Lightweight helper for launching Snapchat with Creative Kit-style data.
 * The actual mobile app navigation is best-effort; on web we preserve the
 * encoded payload to the clipboard for later paste or inspection.
 */

export interface SnapchatCreativeKitOptions {
  caption: string;
  launchData?: string;
}

export const shareToSnapchatCreativeKit = async ({ caption, launchData }: SnapchatCreativeKitOptions) => {
  const payload = [caption, launchData ? `LensLaunchData: ${launchData}` : ""].filter(Boolean).join("\n\n");

  try {
    await navigator.clipboard.writeText(payload);
  } catch (error) {
    console.warn('Snapchat creative kit payload copy failed:', error);
  }

  // Attempt to open the Snapchat Creative Kit camera flow.
  window.location.href = "snapchat://creativekit/camera";

  // Fallback to Snapchat web if the app is unavailable.
  setTimeout(() => {
    window.open("https://www.snapchat.com/", "_blank", "noopener,noreferrer");
  }, 800);
};
