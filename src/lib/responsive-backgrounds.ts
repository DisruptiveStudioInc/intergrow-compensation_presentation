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
  const width = positive(viewport.width, image.width);
  const height = positive(viewport.height, image.height);
  const dpr = positive(viewport.devicePixelRatio, 1);
  const coverWidth = Math.max(width, height * image.width / image.height) * dpr;
  const targetWidth = width <= 680 ? Math.min(coverWidth, 1920) : coverWidth;
  const candidates = [...(image.variants ?? []), image]
    .filter(candidate => candidate.width > 0 && candidate.height > 0)
    .sort((a, b) => a.width - b.width);
  return candidates.find(candidate => candidate.width >= targetWidth)?.src
    ?? candidates.at(-1)?.src
    ?? image.src;
}

/** Select once and key by original URL so DOM fallback and WebGL share the same URL. */
export function selectBackgroundSources(
  images: readonly BackgroundImageSet[],
  viewport: ViewportSize,
): ReadonlyMap<string, string> {
  return new Map(images.map(image => [image.key ?? image.src, selectBackgroundSource(image, viewport)]));
}

function positive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
