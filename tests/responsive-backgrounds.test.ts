import { describe, expect, it } from 'vitest';
import { selectBackgroundSource, selectBackgroundSources, type BackgroundImageSet } from '../src/lib/responsive-backgrounds';

const image: BackgroundImageSet = {
  src: '/images/slides/cover.webp', width: 3840, height: 2160,
  variants: [
    { src: '/_astro/cover-1280.webp', width: 1280, height: 720 },
    { src: '/_astro/cover-1920.webp', width: 1920, height: 1080 },
  ],
};

describe('responsive background source selection', () => {
  it('chooses a variant based on viewport and DPR', () => {
    expect(selectBackgroundSource(image, { width: 390, height: 844, devicePixelRatio: 2 })).toBe('/_astro/cover-1920.webp');
    expect(selectBackgroundSource(image, { width: 390, height: 600, devicePixelRatio: 1 })).toBe('/_astro/cover-1280.webp');
  });

  it('caps mobile demand at 1920px while retaining the original for larger desktop demand', () => {
    expect(selectBackgroundSource(image, { width: 680, height: 1100, devicePixelRatio: 4 })).toBe('/_astro/cover-1920.webp');
    expect(selectBackgroundSource(image, { width: 1440, height: 900, devicePixelRatio: 2 })).toBe('/images/slides/cover.webp');
  });

  it('uses the uncropped cover dimensions for portrait framing', () => {
    const portrait: BackgroundImageSet = {
      src: '/images/portrait.webp', width: 2400, height: 3000,
      variants: [{ src: '/portrait-1280.webp', width: 1280, height: 1600 }],
    };
    expect(selectBackgroundSource(portrait, { width: 390, height: 844, devicePixelRatio: 1 })).toBe('/portrait-1280.webp');
  });

  it('returns one stable source per original URL for consumers to share', () => {
    const selected = selectBackgroundSources([image], { width: 390, height: 844, devicePixelRatio: 1 });
    expect(selected.get(image.src)).toBe(selectBackgroundSource(image, { width: 390, height: 844, devicePixelRatio: 1 }));
  });
});
