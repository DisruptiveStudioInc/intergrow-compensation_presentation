# InterGrow Capital — Presentation

A reusable Astro / TypeScript presentation engine, with a 15-slide compensation presentation in Spanish, English, and French. Static output; no server-side JavaScript, PHP, database, React, or Three.js.

## Run locally

Docker and Compose v2 are the only local prerequisites:

```sh
docker compose up --build
```

Open http://localhost:4321. Source files are mounted for hot reload; dependencies live in a named volume. After changing dependencies, rebuild and refresh that volume with `docker compose down -v` (it contains only installed packages), then start again.

Without Docker: Node 24+ and **pnpm 12.16.1**:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm verify
```

pnpm is pinned by `packageManager`; `pnpm-workspace.yaml` explicitly approves esbuild's required installation script. The lockfile pins all dependency versions. The Dockerfile uses npm only to bootstrap the pinned pnpm binary, never to install project dependencies.

## Structure

- `src/content/slides.ts`: localized copy/labels, shared rank figures, stable slide IDs, and background configuration.
- `src/engine/`: framework-independent browser engine. Copy this directory into another TypeScript frontend; provide matching semantic HTML and `PresentationOptions`.
- `src/components/`: Astro markup and browser initialization. `src/styles/` holds the Intergrow visual theme.
- `src/presentation.config.ts`: the single selected transition and optional floating image.
- `docs/source-notes.md`: source discrepancies preserved from the supplied PDF.

The groups are cover (page 1), plan (pages 2–6), and ranks (pages 7–15). Spanish is `/`, English `/en/`, French `/fr/`. Stable hashes such as `/fr/#rank-300k` survive language changes, reloads, and browser history.

## Create or replace a transition

Create an effect module exporting `TransitionDefinition`:

```ts
import type { TransitionDefinition } from './engine/types';
export const myEffect: TransitionDefinition = {
  id: 'my-dissolve',
  durationMs: 800,
  uniforms: { uEffectCurve: { type: 'float', value: 1.2 } },
  contentTiming: { exitEnd: 0.2, enterStart: 0.55, stagger: 0.045 },
  fragment: `
    vec4 transition(vec2 uv) {
      return mix(getFromColor(uv), getToColor(uv), pow(uProgress, uEffectCurve));
    }
  `,
};
```

Import it into `src/presentation.config.ts` and set `transition: myEffect`. No engine or slide edits are required. The presentation defaults to `crystal-dissolve`. The `abstract-cubes`, `architectural-wipe`, and `crossfade` plug-ins are also included.

Shader contract:

- GLSL ES 1.00, `vec4 transition(vec2 uv)`, normalized bottom-left UV coordinates.
- `uProgress`: 0 = outgoing image, 1 = incoming image; the engine supplies eased progress by default. Effects with a timed sequence can set `easing: 'linear'`. Every effect must produce those exact endpoints.
- `uDirection`: +1 forward, -1 backward. `uResolution`: canvas pixel dimensions.
- `getFromColor(uv)` / `getToColor(uv)` perform aspect-cover sampling, focal-point cropping, brightness, and animated camera transforms.
- Declare custom uniforms through the definition only: `uEffect…` names with `float`, `vec2`, `vec3`, or `vec4` types. The renderer injects their declarations and values.
- Content timings are normalized fractions of the transition. Use `0 < exitEnd <= enterStart < 1`. Stagger is compressed automatically to finish all children within the transition.

Shaders affect photographs only. Text remains HTML, with the shared clock controlling exit/entrance opacity and vertical offset. Shader errors, absent WebGL, or context loss use DOM backgrounds; reduced motion uses a 160ms crossfade without camera or text movement. After context loss the renderer remains on the reliable DOM path until reload.

## Backgrounds and navigation

Each slide has an image URL, normalized focal point `[x,y]`, brightness multiplier, scrim (`left` or `center`), and camera zoom/drift/parallax amplitudes. Use local images for predictable loading. Missing images settle on the brand navy color after an 8-second timeout. The renderer retains at most six decoded/texture assets, protects the current pair, and preloads neighboring images.

One navigation controller owns `idle → loading → transitioning → idle`; input during a transition is ignored. Wheel bursts accumulate with a threshold, touch swipes use a 50px threshold, and vertical gestures respect inner scrolling. A scroll gesture cannot both consume content and change slides. Buttons, group links, arrows, Page Up/Down, Space, Home/End, and fullscreen are supported. Interactive elements keep their native keyboard behavior. Inactive slides are inert, and changes are announced through a localized live region.

`createPresentation(root, options)` returns `{ navigation, destroy }`. Call `destroy()` when removing the presentation in a client application; it releases events, WebGL resources, animation frames, and the optional floating module. Normal browser page lifecycle is handled automatically.

## Optional floating image

Disabled by default. Enable it in `src/presentation.config.ts`:

```ts
floating: {
  src: '/images/your-mark.png',
  position: [0.82, 0.5], size: 140,
  glow: '#2898ee66', rotation: 0, visible: true,
  rings: true, trails: 3,
}
```

Override `position`, `size`, `glow`, `rotation`, or `visible` through each slide's `floating` property. Positions are viewport fractions; sizes are CSS pixels. The module uses Bézier paths, optional rings/trails, idle motion, reduced-motion support, and text collision avoidance. It is dynamically imported only when enabled: the Intergrow presentation requests neither the floating module nor its image.

Development fixture: http://localhost:4321/dev/floating/ demonstrates the floating module and alternate crossfade plug-in. It is not generated in production. The fixture image is an original SVG mark for testing, not a required presentation asset.

## Production Docker

```sh
docker build --target production -t intergrow-presentations:local .
IMAGE=intergrow-presentations:local PORT=8080 docker compose -f compose.production.yaml up -d --wait
```

The multi-stage image verifies/builds with Node/pnpm, then copies only `dist/` into Nginx on port 8080. `/health` is used for container health checks. Production has no source bind mounts. Files under `/_astro/` are hashed and immutable; HTML revalidates. Unknown routes return 404 instead of rendering the Spanish page.

Set the optional build-time `PRESENTATION_SITE_URL` to the public HTTPS origin (for example, `https://presentations.example.com`) when building for production. Astro uses it to emit absolute canonical and locale alternate URLs. Leave it unset for local or preview builds, where those tags are omitted. Docker accepts it as a build argument, and GitHub Actions reads it from the repository variable with the same name.

Production binds to `127.0.0.1` by default. Put the company's reverse proxy in front of `127.0.0.1:8080`, point the chosen domain at the VPS, and terminate HTTPS at that proxy. Change `PORT` for another local port, or `BIND_ADDRESS` when an existing network layout requires it. Domain/TLS setup belongs to the company proxy rather than this static app.

## GitHub → GHCR → VPS

Workflow `.github/workflows/deploy.yml` checks pull requests. Pushes to `main` also publish `ghcr.io/<owner>/<repo>:<commit-sha>`. Deployment is opt-in via repository variable `DEPLOY_ENABLED=true`.

Configure these GitHub production environment secrets:

| Secret | Value |
| --- | --- |
| `VPS_HOST` | Server DNS name or IP |
| `VPS_USER` | SSH account with Docker access |
| `VPS_SSH_KEY` | Deploy account's private SSH key |
| `VPS_KNOWN_HOSTS` | Verified server host-key line (include `[host]:port` for custom ports) |

Optional repository variables: `PRESENTATION_SITE_URL` (public HTTPS origin used at build time), `DEPLOY_DIR` (default `/opt/intergrow-presentation`, absolute path without spaces), `VPS_SSH_PORT` (22), and `PORT` (8080). Install Docker Engine, Compose v2 supporting `up --wait`, and `flock` on the Linux VPS; ensure the deploy account can create/write its directory. For a private GHCR package, authenticate that account on the VPS once with a read-packages token through `docker login ghcr.io --password-stdin`. The workflow never copies registry credentials to the server.

The deploy step copies Compose plus `release.sh`, pulls the new immutable image, records `.env.previous`, then waits for container health. Failed releases restore the previous image; failed first releases remove the failed container. Releases are serialized. Images are not pruned, so the previous release remains available. A single-container replacement can cause a brief interruption; this is not a zero-downtime deployment.

Manual rollback from the deployment directory:

```sh
previous_image=$(sed -n 's/^IMAGE=//p' .env.previous)
sh release.sh "$previous_image" 8080
```

The workspace supplied for implementation had an empty `.git` placeholder. Connect this folder to the intended GitHub repository before pushing; no remote, credentials, or production deployment is assumed.

## Verification

`pnpm verify` runs Astro/TypeScript checking, engine tests, content validation, and the production build. Tests cover navigation serialization, history/deep links, keyboard exclusions, scroll-boundary intent, animation timing, plug-in composition, reduced motion, missing images, WebGL fallback, and teardown. Browser QA checks desktop/mobile layout, language switching, live WebGL initialization, and the optional fixture. See `docs/verification.md` for observed results and limitations.
