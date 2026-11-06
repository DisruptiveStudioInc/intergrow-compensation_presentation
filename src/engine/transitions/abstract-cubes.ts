import type { TransitionDefinition } from '../types';

export const abstractCubes: TransitionDefinition = {
  id: 'abstract-cubes',
  durationMs: 2800,
  uniforms: {},
  contentTiming: { exitEnd: 0.18, enterStart: 0.70, stagger: 0.035 },
  fragment: `
    // Small integer intermediates keep the particle seeds stable at mediump.
    float particleSeed(float index, float salt) {
      float seed = mod(index * 13.0 + salt * 31.0, 97.0);
      return mod(seed * 17.0 + index * 3.0, 97.0) / 97.0;
    }

    vec4 swarmBackground(vec2 uv, float reveal) {
      if (reveal <= 0.0) return getFromColor(uv);
      if (reveal >= 1.0) return getToColor(uv);
      return mix(getFromColor(uv), getToColor(uv), reveal);
    }

    mat3 cubeRotation(vec3 angles) {
      vec3 c = cos(angles);
      vec3 s = sin(angles);
      mat3 yaw = mat3(c.y, 0.0, -s.y, 0.0, 1.0, 0.0, s.y, 0.0, c.y);
      mat3 pitch = mat3(1.0, 0.0, 0.0, 0.0, c.x, s.x, 0.0, -s.x, c.x);
      mat3 roll = mat3(c.z, s.z, 0.0, -s.z, c.z, 0.0, 0.0, 0.0, 1.0);
      return roll * yaw * pitch;
    }

    vec4 transition(vec2 uv) {
      if (uProgress <= 0.0) return getFromColor(uv);
      if (uProgress >= 1.0) return getToColor(uv);

      // Both navigation directions use the same left-to-right flight path.
      const float band = 0.32;
      float trailing = mix(-band, 1.0, uProgress);
      float bandX = (uv.x - trailing) / band;
      if (bandX <= 0.0) return getToColor(uv);
      if (bandX >= 1.0) return getFromColor(uv);

      // Break up the reveal inside the trailing edge of the swarm.
      float wake = 0.19 + 0.06 * sin(uv.y * 17.0 + uProgress * 7.0)
        + 0.03 * sin(uv.y * 39.0 - uProgress * 4.0);
      float reveal = 1.0 - smoothstep(0.015, wake, bandX);
      float aspect = uResolution.x / uResolution.y;
      float bandWidth = band * aspect;
      vec2 point = vec2(bandX * bandWidth, uv.y);
      const vec3 eye = vec3(-0.54, 0.48, 5.4);

      float nearest = -4.0;
      float thickness = 0.0;
      float bevel = 0.0;
      vec3 normal = vec3(0.0);
      vec3 view = vec3(0.0, 0.0, 1.0);
      float scale = 0.0;

      for (int i = 0; i < 24; ++i) {
        float index = float(i);
        float sizeSeed = particleSeed(index, 1.0);
        float size = min(bandWidth * 0.185, 0.117) * mix(0.21, 1.0, sizeSeed * sizeSeed);
        float speed = mix(-0.33, 0.33, particleSeed(index, 2.0));
        float phase = particleSeed(index, 3.0) * 6.2831853;
        float drift = speed * (uProgress - 0.5) + 0.06 * sin(phase + uProgress * 5.0);
        float lane = clamp(mix(0.08, 0.92, particleSeed(index, 4.0)) + drift, 0.0, 1.0);
        float padding = size * 2.05;
        float y = mix(0.055, 0.945, (index + particleSeed(index, 5.0)) / 24.0);
        y += 0.086 * sin(phase + uProgress * mix(3.0, 7.0, sizeSeed));
        vec2 center = vec2(mix(padding, bandWidth - padding, lane), y);
        vec2 relative = (point - center) / size;
        if (max(abs(relative.x), abs(relative.y)) > 2.05) continue;

        vec3 angularSpeed = vec3(
          mix(2.0, 7.8, particleSeed(index, 6.0)),
          mix(3.0, 10.0, particleSeed(index, 7.0)),
          mix(-4.0, 4.0, particleSeed(index, 8.0))
        );
        mat3 rotation = cubeRotation(vec3(phase, phase * 0.7, phase * 0.43) + angularSpeed * uProgress);
        vec3 rayWorld = normalize(vec3(relative, 0.0) - eye);
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

        float depth = (eye.z + rayWorld.z * entry) * size + particleSeed(index, 9.0) * 0.25;
        if (depth <= nearest) continue;
        nearest = depth;
        thickness = exitPoint - entry;
        scale = size;
        view = -rayWorld;

        vec3 hit = origin + ray * entry;
        vec3 bevelWeights = smoothstep(vec3(0.82), vec3(1.0), abs(hit));
        bevel = clamp(dot(bevelWeights, vec3(1.0)) - 1.0, 0.0, 1.0);
        normal = rotation * normalize(sign(hit) * bevelWeights);
      }

      vec4 clear = swarmBackground(uv, reveal);
      if (nearest < -3.0) return clear;

      // Dark glass faces and bright cyan, white, and warm glints on the bevels.
      float facing = clamp(dot(normal, view), 0.0, 1.0);
      float fresnel = pow(1.0 - facing, 2.0);
      vec3 bend = refract(-view, normal, 0.63);
      vec2 refraction = (bend.xy + view.xy) * min(thickness, 2.5) * scale * 0.65;
      vec3 transmitted = swarmBackground(uv + refraction / vec2(aspect, 1.0), reveal).rgb;

      const vec3 cyan = vec3(-0.68, 0.54, 0.49);
      const vec3 white = vec3(0.75, 0.55, 0.37);
      const vec3 amber = vec3(0.57, -0.78, 0.26);
      float key = max(0.0, dot(normal, cyan));
      float fill = max(0.0, dot(normal, white));
      float warm = max(0.0, dot(normal, amber));
      vec3 reflected = reflect(-view, normal);
      float shine = pow(max(0.0, dot(reflected, white)), 14.0);
      vec3 face = mix(transmitted * vec3(0.38, 0.57, 0.88), vec3(0.017, 0.057, 0.19), 0.53);
      face += vec3(0.025, 0.19, 0.57) * key + vec3(0.035, 0.06, 0.21) * fill;
      vec3 light = vec3(0.035, 0.77, 1.0) * key
        + vec3(0.72, 0.94, 1.0) * fill
        + vec3(1.0, 0.74, 0.12) * warm * 0.63;
      face = mix(face, light, min(0.95, bevel * 0.88 + fresnel * 0.54));
      face += vec3(0.69, 0.92, 1.0) * shine * (0.17 + 0.54 * bevel);
      float bandEdge = smoothstep(0.0, 0.04, bandX) * (1.0 - smoothstep(0.96, 1.0, bandX));
      return vec4(mix(clear.rgb, face, bandEdge), 1.0);
    }
  `,
};
