/**
 * lens-parameters.ts
 *
 * Provides a small lens launch data encoder that's compatible with Snapchat-style
 * lens parameter payloads and launch-data workflows.
 */

export interface LensLaunchData {
  lensId: string;
  filterId: string;
  filterName: string;
  themeColor: string;
  caption: string;
  sticker?: {
    id: string;
    emoji: string;
    posX: number;
    posY: number;
    rotation: number;
    scale: number;
    color: string;
  };
  timestamp: number;
}

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return "{}";
  }
};

export const encodeLaunchData = (payload: LensLaunchData): string => {
  const json = safeStringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
};

export const decodeLaunchData = (encoded: string): LensLaunchData | null => {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json) as LensLaunchData;
  } catch {
    return null;
  }
};
