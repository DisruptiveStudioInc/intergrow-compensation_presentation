import { clamp } from '../math';
import type { TransitionDefinition } from '../types';

// Start at the first fracture in the reference clip and keep its original motion timing.
const leadInMs = 500;
const durationMs = 5388 - leadInMs;
const firstBreak = 0.48;
const sweepDuration = 4.25;
const clearTime = 5.167;
const slope = 0.75;
const targetRows = 34;
const maxColumns = 96;
const fractureColumns = 4;
const fractureSwing = 0.095;
const fractureDetail = 0.026;

function contentEdge(
  front: number,
  viewport: DOMRectReadOnly,
  slide: DOMRectReadOnly,
  reveal: boolean,
) {
  const size = Math.max(viewport.height / targetRows, viewport.width / maxColumns);
  if (size <= 0) return reveal ? 'inset(100%)' : '';
  const columns = Math.ceil(viewport.width / size - 0.001);
  const rows = Math.ceil(viewport.height / size - 0.001);
  const gridLeft = (viewport.width - columns * size) / 2;
  const gridTop = (viewport.height - rows * size) / 2;
  const offsetX = slide.left - viewport.left;
  const offsetY = slide.top - viewport.top;
  const edge = reveal ? '100%' : '0';
  const points = [`0 ${edge}`];

  // Follow the staggered fracture columns while keeping the HTML selectable.
  for (let column = 0; column < columns; column++) {
    const columnLeft = gridLeft + column * size;
    const left = clamp(columnLeft - offsetX, 0, slide.width);
    const right = clamp(columnLeft + size - offsetX, 0, slide.width);
    if (left === right) continue;
    const x = (columnLeft + size / 2) / viewport.width;
    const group = Math.floor(column / fractureColumns);
    const delay = fractureSwing * Math.sin(group * 1.91) + fractureDetail * Math.sin(group * 3.83);
    const delayedFront = front - delay * (1 + slope) / sweepDuration;
    const frontY = viewport.height * (1 - delayedFront + slope * x);
    const snapped = gridTop + Math.round((frontY - gridTop) / size) * size;
    const y = clamp(snapped - offsetY, 0, slide.height);
    points.push(`${left}px ${y}px`, `${right}px ${y}px`);
  }
  points.push(`100% ${edge}`);
  return `polygon(${points.join(', ')})`;
}

export const crystalDissolve: TransitionDefinition = {
  id: 'crystal-dissolve',
  durationMs,
  easing: 'linear',
  uniforms: {},
  contentTiming: { exitEnd: 0.28, enterStart: 0.65, stagger: 0.03 },
  clipContent(progress, viewport, slide) {
    if (progress <= 0) return { from: '', to: 'inset(100%)' };
    const seconds = (leadInMs + progress * durationMs) / 1000;
    if (seconds >= clearTime) return { from: 'inset(100%)', to: '' };
    const front = (seconds - firstBreak) * (1 + slope) / sweepDuration;
    const wake = front - 0.40 * (1 + slope) / sweepDuration;
    return {
      from: contentEdge(front, viewport, slide, false),
      to: contentEdge(wake, viewport, slide, true),
    };
  },
  fragment: `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #endif

    const float sweepSlope = ${slope};
    const float secondsPerUnit = ${sweepDuration} / (1.0 + sweepSlope);
    const float firstBreak = ${firstBreak};
    const float clearTime = ${clearTime};
    const float longestLife = 0.92;
    const float crackTime = 0.15;

    float crystalSeed(vec2 cell, float salt) {
      float row = mod(cell.y * 23.0 + salt * 19.0, 127.0);
      float seed = mod(cell.x * 11.0 + row * 7.0, 127.0);
      return mod(seed * (1.0 + mod(seed, 11.0)) + row * 3.0, 127.0) / 126.0;
    }

    float sweepTime(vec2 uv) {
      return firstBreak + (uv.y + sweepSlope * uv.x) * secondsPerUnit;
    }

    float breakTime(vec2 cell, vec2 center) {
      float group = floor(cell.x / ${fractureColumns}.0);
      float delay = ${fractureSwing} * sin(group * 1.91) + ${fractureDetail} * sin(group * 3.83);
      return sweepTime(center) + delay + (crystalSeed(cell, 1.0) - 0.5) * 0.11;
    }

    mat3 crystalRotation(vec3 angles) {
      vec3 c = cos(angles);
      vec3 s = sin(angles);
      mat3 yaw = mat3(c.y, 0.0, -s.y, 0.0, 1.0, 0.0, s.y, 0.0, c.y);
      mat3 pitch = mat3(1.0, 0.0, 0.0, 0.0, c.x, s.x, 0.0, -s.x, c.x);
      mat3 roll = mat3(c.z, s.z, 0.0, -s.z, c.z, 0.0, 0.0, 0.0, 1.0);
      return roll * yaw * pitch;
    }

    vec4 transition(vec2 uv) {
      if (uProgress <= 0.0) return getFromColor(uv);
      float seconds = (${leadInMs}.0 + uProgress * ${durationMs}.0) * 0.001;
      if (seconds >= clearTime) return getToColor(uv);

      // Outside the diagonal crumble front, skip all particle intersections.
      float size = max(uResolution.y / ${targetRows}.0, uResolution.x / ${maxColumns}.0);
      vec2 tileUv = size / uResolution;
      float nearbyTime = sweepTime(uv);
      float margin = 1.5 * (tileUv.y + sweepSlope * tileUv.x) * secondsPerUnit + ${fractureSwing + fractureDetail + 0.055};
      if (seconds < nearbyTime - margin - crackTime) return getFromColor(uv);
      if (seconds > nearbyTime + margin + longestLife) return getToColor(uv);

      vec2 span = uResolution / size;
      vec2 grid = clamp(ceil(span - 0.001), vec2(1.0), vec2(${maxColumns}.0, ${targetRows}.0));
      vec2 point = (uv - 0.5) * span + grid * 0.5;
      vec2 tile = clamp(floor(point), vec2(0.0), grid - 1.0);
      vec2 tileCenter = tile + 0.5;
      float detach = breakTime(tile, (tileCenter - grid * 0.5) * tileUv + 0.5);

      if (seconds < detach) {
        // Only the tiles about to detach show a seam in the outgoing slide.
        vec2 edge = 0.5 - abs(point - tileCenter);
        float seam = 1.0 - smoothstep(0.012, 0.060, min(edge.x, edge.y));
        float crack = 1.0 - smoothstep(0.0, crackTime, detach - seconds);
        return vec4(getFromColor(uv).rgb * (1.0 - crack * (0.08 + 0.16 * seam)), 1.0);
      }

      const vec3 eye = vec3(-0.29, 0.36, 5.6);
      float nearest = -2.0;
      float thickness = 0.0;
      float bevel = 0.0;
      float formed = 0.0;
      float phase = 0.0;
      float radius = 0.0;
      vec2 source = uv;
      vec3 normal = vec3(0.0, 0.0, 1.0);
      vec3 view = normal;

      // Neighboring tiles can overlap when they tilt and fall away from the sheet.
      for (int dy = -1; dy <= 1; dy++) {
        for (int dx = -1; dx <= 1; dx++) {
          vec2 cell = tile + vec2(float(dx), float(dy));
          if (any(lessThan(cell, vec2(0.0))) || any(greaterThanEqual(cell, grid))) continue;
          vec2 center = cell + 0.5;
          vec2 centerUv = (center - grid * 0.5) * tileUv + 0.5;
          float start = breakTime(cell, centerUv);
          float age = seconds - start;
          if (age < 0.0 || age >= longestLife) continue;
          float lifetime = min(mix(0.68, longestLife, crystalSeed(cell, 2.0)), clearTime - start);
          if (age >= lifetime) continue;

          float life = age / lifetime;
          float halfSize = 0.49 * (1.0 - smoothstep(0.25, 1.0, life));
          if (halfSize * size < 0.25) continue;
          float fall = life * life;
          vec2 drift = vec2(
            mix(-0.44, 0.25, crystalSeed(cell, 3.0)),
            mix(-0.69, -0.28, crystalSeed(cell, 4.0))
          ) * fall;
          vec2 relative = (point - center - drift) / halfSize;
          if (max(abs(relative.x), abs(relative.y)) > 1.95) continue;

          float turn = smoothstep(0.0, 0.24, age) + 0.85 * life;
          vec3 angles = vec3(
            mix(-1.18, 1.40, crystalSeed(cell, 5.0)),
            mix(-1.50, 1.38, crystalSeed(cell, 6.0)),
            mix(-0.76, 0.78, crystalSeed(cell, 7.0))
          ) * turn;
          mat3 rotation = crystalRotation(angles);
          vec3 rayWorld = normalize(vec3(relative, 1.0) - eye);
          vec3 origin = vec3(dot(eye, rotation[0]), dot(eye, rotation[1]), dot(eye, rotation[2]));
          vec3 ray = vec3(dot(rayWorld, rotation[0]), dot(rayWorld, rotation[1]), dot(rayWorld, rotation[2]));
          vec3 safeRay = mix(vec3(-1.0), vec3(1.0), step(vec3(0.0), ray)) * max(abs(ray), vec3(0.002));
          vec3 a = (-1.0 - origin) / safeRay;
          vec3 b = (1.0 - origin) / safeRay;
          vec3 nearPlane = min(a, b);
          vec3 farPlane = max(a, b);
          float entry = max(nearPlane.x, max(nearPlane.y, nearPlane.z));
          float exitPoint = min(farPlane.x, min(farPlane.y, farPlane.z));
          if (entry >= exitPoint) continue;

          float depth = (eye.z + rayWorld.z * entry) * halfSize + crystalSeed(cell, 8.0) * 0.24;
          if (depth <= nearest) continue;
          nearest = depth;
          thickness = exitPoint - entry;
          radius = halfSize;
          formed = smoothstep(0.0, 0.19, age);
          phase = life;
          view = -rayWorld;

          vec3 hit = origin + ray * entry;
          vec3 weights = smoothstep(vec3(0.80), vec3(1.0), abs(hit));
          bevel = clamp(dot(weights, vec3(1.0)) - 1.0, 0.0, 1.0);
          normal = rotation * normalize(sign(hit) * weights);

          // The original image is carried by each fragment as it separates.
          vec2 face = hit.xy;
          if (nearPlane.x >= max(nearPlane.y, nearPlane.z)) face = vec2(-hit.z * sign(hit.x), hit.y);
          else if (nearPlane.y >= nearPlane.z) face = vec2(hit.x, -hit.z * sign(hit.y));
          source = centerUv + 0.5 * face * tileUv;
        }
      }

      vec4 destination = getToColor(uv);
      if (nearest < -1.0) return destination;

      vec3 bent = refract(-view, normal, 0.63);
      vec2 shift = (bent.xy + view.xy) * min(thickness, 2.7) * radius * tileUv * 0.82;
      vec3 transmitted = getToColor(uv + shift).rgb;
      // Separate the color channels slightly at the glass edges.
      if (bevel > 0.03) {
        transmitted.r = getToColor(uv + shift * 0.71).r;
        transmitted.b = getToColor(uv + shift * 1.28).b;
      }

      const vec3 cyanLight = vec3(-0.70, 0.61, 0.37);
      const vec3 pinkLight = vec3(0.83, 0.40, 0.39);
      const vec3 goldLight = vec3(0.30, -0.88, 0.37);
      float cyan = max(0.0, dot(normal, cyanLight));
      float pink = max(0.0, dot(normal, pinkLight));
      float gold = max(0.0, dot(normal, goldLight));
      float fresnel = pow(1.0 - clamp(dot(normal, view), 0.0, 1.0), 2.0);
      vec3 reflection = reflect(-view, normal);
      float highlight = pow(max(0.0, dot(reflection, pinkLight)), 15.0);
      vec3 colorLights = vec3(0.03, 0.83, 1.0) * cyan
        + vec3(1.0, 0.10, 0.59) * pink
        + vec3(1.0, 0.63, 0.10) * gold;

      vec3 photo = getFromColor(source).rgb;
      vec3 glass = mix(transmitted * vec3(0.45, 0.74, 0.96), photo, 0.22);
      glass = mix(glass, vec3(0.019, 0.047, 0.11), 0.24);
      glass += colorLights * (0.09 + 0.12 * fresnel);
      glass = mix(glass, colorLights, min(0.91, bevel * 0.84 + fresnel * 0.39));
      glass += vec3(0.92, 0.96, 1.0) * highlight * (0.10 + 0.32 * bevel);
      vec3 crystal = mix(photo, glass, formed);
      float vanishing = (1.0 - smoothstep(0.86, 1.0, phase)) * smoothstep(0.25, 0.90, radius * size);
      return vec4(mix(destination.rgb, crystal, vanishing), 1.0);
    }
  `,
};
