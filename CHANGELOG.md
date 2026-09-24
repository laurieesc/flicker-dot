# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
uses [Semantic Versioning](https://semver.org/) — while the major version
is `0`, the public API may still shift between minor versions.

## [Unreleased]

### Added
- SwiftUI player: a `FlickerDot` Swift package for iOS, macOS, tvOS,
  watchOS and visionOS. It takes the same `grids` data and matches the
  React player's geometry, 150ms timing and props. It lives in `swift/`
  with its manifest at the repo root; the npm package is unchanged.
- CI runs the Swift test suite on macOS alongside the React tests.

## [0.1.4] - 2026-07-19

### Changed
- Publishing now uses npm's OIDC Trusted Publishing instead of a
  long-lived `NPM_TOKEN` secret. GitHub Actions proves its identity to
  npm per-run and npm issues an ephemeral, job-scoped credential —
  nothing to rotate, nothing to leak.
- CI bumped to `actions/checkout@v5`, `actions/setup-node@v5`, and
  Node 22 in both workflows. `publish.yml` also pins `npm@11`, the
  minimum version required for trusted publishing.
- Normalized `repository.url` (`npm pkg fix`) to the `git+https://`
  form OIDC provenance expects.

### Fixed
- README now explains *how* to get a spinner's frame data, not just
  *where* — the Code panel's CLI and Manual tabs, including the
  Lottie export that shipped in the app's `v1.3.0`.

## [0.1.3] - 2026-07-12

### Fixed
- Republished the README. The version published with `0.1.2` was outdated —
  it still described the package as pre-release and was missing the props
  table, usage examples, and theming guide. This release corrects it.
  Documentation only, no runtime changes — confirmed via a byte-identical
  tarball diff against `0.1.2`.

## [0.1.2] - 2026-07-11

### Added
- Test suite (`vitest`), covering `computeModel` invariants and
  `<FlickerSpinner>` render output — 36 tests.
- CI now runs the test suite on every push and pull request.
- Publishing is gated on tests passing: a failing suite blocks a release.

### Fixed
- No runtime changes. This release is entirely test infrastructure —
  confirmed via a byte-identical tarball diff against `0.1.1`.

## [0.1.1] - 2026-07-10

### Fixed
- `<FlickerSpinner>` no longer drops the OFF-state circle for dots that
  animate. Previously, an animated dot rendered only its ON-state circle,
  so fading to OFF faded to nothing instead of the OFF color. Every dot
  now gets an unconditional backing circle, matching the app's own code
  exporters.

## [0.1.0] - 2026-07-10

### Added
- Initial public release. Player-only package: canonical flat-49 boolean
  schema, shared geometry and timing constants, `computeModel` (the pure
  function both the component and the app's code exporters build from),
  and `<FlickerSpinner>` — a CSS-keyframe animated component with no JS
  timer.
- Props: `grids`, `onColor` / `offColor` / `theme`, `variant`, `size`,
  `playing`, `speed`, `reverse`, `fit`, `title`, `className`, `style`.
- MIT license.
