export function selectBackgroundSource(image, viewport) {
  const positive = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;
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
