export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const ease = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };
export function cameraAt(seconds: number, zoom: number, drift: number, reduced: boolean) {
  return reduced ? [1, 0] : [1 + zoom * (1 - Math.exp(-seconds / 9)), Math.sin(seconds * 0.12) * drift];
}
export function bezier(a: number, b: number, control: number, progress: number) {
  return (1-progress)**2*a + 2*(1-progress)*progress*control + progress**2*b;
}
export function contentFrame(progress: number, index: number, count: number, timing: {exitEnd:number;enterStart:number;stagger:number}) {
  // Compress stagger to keep every child fully entered before the shared transition ends.
  const stagger = Math.min(timing.stagger, 0.2 / Math.max(1, count - 1));
  const start = timing.enterStart + index * stagger;
  return ease((progress - start) / Math.max(0.01, 1 - timing.enterStart - (count - 1) * stagger));
}
