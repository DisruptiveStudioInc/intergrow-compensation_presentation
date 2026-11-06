import { selectBackgroundSource as chooseBackgroundSource } from './background-selector.js';

/** Build-time image URL variants paired with their intrinsic dimensions. */
export interface BackgroundImageCandidate {
  src: string;
  width: number;
  height: number;
}

export interface BackgroundImageSet extends BackgroundImageCandidate {
  /** Stable content key used to find this image from slide definitions. */
  key?: string;
  /** Smaller generated WebP variants. The original remains the full-size option. */
  variants?: readonly BackgroundImageCandidate[];
}

export interface ViewportSize {
  width: number;
  height: number;
  devicePixelRatio: number;
}

/**
 * Return the one source to use for a background at the current viewport and DPR.
 * Width demand accounts for `background-size: cover`, including portrait crops.
 * Mobile sources are capped at 1920px to avoid needlessly large texture uploads.
 */
export function selectBackgroundSource(image: BackgroundImageSet, viewport: ViewportSize): string {
  return chooseBackgroundSource(image, viewport);
}

/** Select once and key by original URL so DOM fallback and WebGL share the same URL. */
export function selectBackgroundSources(
  images: readonly BackgroundImageSet[],
  viewport: ViewportSize,
): ReadonlyMap<string, string> {
  return new Map(images.map(image => [image.key ?? image.src, selectBackgroundSource(image, viewport)]));
}
