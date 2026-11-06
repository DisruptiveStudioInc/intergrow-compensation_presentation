import type { TransitionDefinition } from '../types';
export const crossfade: TransitionDefinition = {
  id: 'crossfade',
  durationMs: 650,
  uniforms: {},
  contentTiming: { exitEnd: 0.25, enterStart: 0.4, stagger: 0.04 },
  fragment: `vec4 transition(vec2 uv) {
    return mix(getFromColor(uv), getToColor(uv), uProgress);
  }`,
};
