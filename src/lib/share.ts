/**
 * share.ts
 *
 * Multi-platform sharing utility supporting:
 * - LinkedIn
 * - WhatsApp
 * - Instagram
 * - Facebook
 * - Snapchat
 * - Twitter/X
 */

export interface ShareOptions {
  title: string;
  text?: string;
  url?: string;
  hashtags?: string[];
}

/**
 * Share to LinkedIn
 */
export const shareToLinkedIn = (options: ShareOptions) => {
  const { title, url } = options;
  const linkedInUrl = new URL("https://www.linkedin.com/sharing/share-offsite/");
  linkedInUrl.searchParams.append("url", url || window.location.href);
  window.open(linkedInUrl.toString(), "_blank", "noopener,noreferrer");
};

/**
 * Share to WhatsApp
 */
export const shareToWhatsApp = (options: ShareOptions) => {
  const { title, text, url } = options;
  const message = `${title}${text ? "\n" + text : ""}${url ? "\n" + url : ""}`;
  const whatsappUrl = new URL("https://wa.me/");
  whatsappUrl.searchParams.append("text", message);
  window.open(whatsappUrl.toString(), "_blank", "noopener,noreferrer");
};

/**
 * Share to Instagram
 * Note: Instagram doesn't support direct sharing via URL scheme on web.
 * This opens Instagram's web app; users must manually share.
 */
export const shareToInstagram = (options: ShareOptions) => {
  const { url } = options;
  // Instagram web doesn't have a direct share URL, so we open the app
  window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  // Copy URL to clipboard as a fallback
  if (url) {
    navigator.clipboard.writeText(url).catch(() => {});
  }
};

/**
 * Share to Facebook
 */
export const shareToFacebook = (options: ShareOptions) => {
  const { url } = options;
  const facebookUrl = new URL("https://www.facebook.com/sharer/sharer.php");
  facebookUrl.searchParams.append("u", url || window.location.href);
  window.open(facebookUrl.toString(), "_blank", "noopener,noreferrer");
};

/**
 * Share to Snapchat
 * Note: Snapchat doesn't support direct web sharing. This opens Snapchat;
 * users must manually share. URL is copied to clipboard.
 */
export const shareToSnapchat = (options: ShareOptions) => {
  const { url } = options;
  // Open Snapchat app (if available)
  window.open("snapchat://", "_blank");
  // Copy URL to clipboard
  if (url) {
    navigator.clipboard.writeText(url).catch(() => {});
  }
};

/**
 * Share to Twitter/X
 */
export const shareToTwitter = (options: ShareOptions) => {
  const { title, url, hashtags } = options;
  const twitterUrl = new URL("https://twitter.com/intent/tweet");
  const text = title + (hashtags ? " " + hashtags.map((h) => `#${h}`).join(" ") : "");
  twitterUrl.searchParams.append("text", text);
  if (url) {
    twitterUrl.searchParams.append("url", url);
  }
  window.open(twitterUrl.toString(), "_blank", "noopener,noreferrer");
};

/**
 * Generic share handler that opens a platform selector
 */
export const shareToMultiplePlatforms = (options: ShareOptions) => {
  return {
    linkedin: () => shareToLinkedIn(options),
    whatsapp: () => shareToWhatsApp(options),
    instagram: () => shareToInstagram(options),
    facebook: () => shareToFacebook(options),
    snapchat: () => shareToSnapchat(options),
    twitter: () => shareToTwitter(options),
  };
};
