# Verification — 2026-11-04

## Automated

- `pnpm verify`: Astro/TypeScript checking with no errors, warnings, or hints; 21 passing tests across four suites; content validation; static production build.
- Validated 15 slides in each of Spanish, English, and French, all localized labels, group boundaries, shared rank data, and local background files.
- `pnpm peers check`: no peer dependency issues.
- `sh -n deploy/release.sh`: passes shell syntax validation.
- Built the production Docker image with a frozen pnpm lockfile. The Docker build also ran the verification suite (20 tests at build time; the subsequent 21st test adds shader-compile-failure coverage without changing application code).
- Started the production image on localhost port 4330. `/`, `/en/`, `/fr/`, and `/health` returned 200; `/missing/` and `/dev/floating/` returned 404.
- Container health became `healthy`; Nginx configuration validation passed. No mounts, Node executable, or PHP executable were present in the runtime container.
- Started the development Compose service from its Docker build on localhost port 4332; French route responded, pnpm reported 12.16.1, and the published port was restricted to `127.0.0.1`.

The configured Docker Desktop socket was inactive. Docker checks used the available system daemon with `docker -H unix:///var/run/docker.sock ...`; developers with a working default Docker context can use the documented commands unchanged.

## Browser checks

- Desktop at 1212×900: brand typography/logo, photographic backgrounds, navigation, content, controls, and the live WebGL renderer displayed correctly without console errors.
- Mobile at 390×844: the dense 12M slide had no horizontal overflow. Scrolling reached the bottom of its inner content without advancing the presentation.
- Switching Spanish → French → English retained `#rank-12m`; headings, controls, and rank figures displayed in each language.
- Home shortcut returned the English presentation to the cover.
- Landscape at 844×390: verified direct rank selection in the final production build, inner vertical scrolling, fixed controls, and no horizontal overflow.
- `/dev/floating/`: optional image, rings, and crossfade shader rendered successfully. The fixture's “Probar fallback” control triggered real WebGL context loss; the renderer switched to DOM fallback and next-slide navigation still worked.
- Production asset inventory showed the main script, shared math module, company photos/logo, and fonts; it did not show the floating module or fixture image.

Touch events, reduced motion, rapid input, history restoration, shader compilation failure, and missing images additionally have automated coverage. This is not a physical-device or GPU frame-rate benchmark.

## Deployment status

GitHub publishing, VPS deployment, reverse-proxy domain/TLS, and rollback on the company's server have not been executed. The supplied folder's `.git` placeholder is empty; no GitHub remote or server credentials were supplied. Workflow and required settings are documented in README.md. Source-content discrepancies are documented in source-notes.md.
