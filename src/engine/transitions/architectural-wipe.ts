import type { TransitionDefinition } from '../types';
export const architecturalWipe: TransitionDefinition = {
  id: 'architectural-wipe',
  durationMs: 900,
  uniforms: { uEffectFeather: { type: 'float', value: 0.035 } },
  contentTiming: { exitEnd: 0.2, enterStart: 0.55, stagger: 0.045 },
  fragment: `
    vec4 transition(vec2 uv) {
      if (uProgress <= 0.0) return getFromColor(uv);
      if (uProgress >= 1.0) return getToColor(uv);
      float x = uDirection > 0.0 ? uv.x : 1.0 - uv.x;
      float edge = mix(-uEffectFeather, 1.0 + uEffectFeather, uProgress);
      float reveal = 1.0 - smoothstep(edge-uEffectFeather, edge+uEffectFeather, x);
      return mix(getFromColor(uv), getToColor(uv), reveal);
    }`,
};
