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
 * Opens LinkedIn share dialog with the URL
 */
export const shareToLinkedIn = (options: ShareOptions) => {
  const { title, url } = options;
  const linkedInUrl = new URL("https://www.linkedin.com/sharing/share-offsite/");
  linkedInUrl.searchParams.append("url", url || window.location.href);
  window.open(linkedInUrl.toString(), "_blank", "noopener,noreferrer,width=600,height=600");
};

/**
 * Share to WhatsApp
 * Opens WhatsApp with the message pre-filled
 */
export const shareToWhatsApp = (options: ShareOptions) => {
  const { title, text, url } = options;
  const message = `${title}${text ? "\n" + text : ""}${url ? "\n" + url : ""}`;
  const whatsappUrl = new URL("https://wa.me/");
  whatsappUrl.searchParams.append("text", encodeURIComponent(message));
  window.open(whatsappUrl.toString(), "_blank", "noopener,noreferrer");
};

/**
 * Share to Instagram
 * Opens Instagram Stories share or direct message with URL copied to clipboard
 */
export const shareToInstagram = (options: ShareOptions) => {
  const { title, url } = options;
  // Try to open Instagram app or web
  const instagramUrl = `instagram://`;
  
  // Copy the full message to clipboard for manual paste
  const fullMessage = `${title}${url ? "\n" + url : ""}`;
  navigator.clipboard.writeText(fullMessage).then(() => {
    // Open Instagram (web or app)
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }).catch(() => {
    // Fallback: just open Instagram
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  });
};

/**
 * Share to Facebook
 * Opens Facebook share dialog
 */
export const shareToFacebook = (options: ShareOptions) => {
  const { url } = options;
  const facebookUrl = new URL("https://www.facebook.com/sharer/sharer.php");
  facebookUrl.searchParams.append("u", url || window.location.href);
  facebookUrl.searchParams.append("quote", options.title || "Check this out!");
  window.open(facebookUrl.toString(), "_blank", "noopener,noreferrer,width=600,height=600");
};

/**
 * Share to Snapchat
 * Opens Snapchat app or web with URL copied to clipboard
 */
export const shareToSnapchat = (options: ShareOptions) => {
  const { title, url } = options;
  
  // Copy to clipboard for manual paste in Snapchat
  const fullMessage = `${title}${url ? "\n" + url : ""}`;
  navigator.clipboard.writeText(fullMessage).then(() => {
    // Try to open Snapchat app
    const snapchatUrl = `snapchat://`;
    window.location.href = snapchatUrl;
    
    // Fallback to web after a delay
    setTimeout(() => {
      window.open("https://www.snapchat.com/", "_blank", "noopener,noreferrer");
    }, 1000);
  }).catch(() => {
    // Fallback: open Snapchat web
    window.open("https://www.snapchat.com/", "_blank", "noopener,noreferrer");
  });
};

/**
 * Share to Twitter/X
 * Opens X (formerly Twitter) with pre-filled tweet
 */
export const shareToTwitter = (options: ShareOptions) => {
  const { title, url, hashtags } = options;
  const xUrl = new URL("https://x.com/intent/tweet");
  const text = title + (hashtags ? " " + hashtags.map((h) => `#${h}`).join(" ") : "");
  xUrl.searchParams.append("text", text);
  if (url) {
    xUrl.searchParams.append("url", url);
  }
  window.open(xUrl.toString(), "_blank", "noopener,noreferrer,width=600,height=600");
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
