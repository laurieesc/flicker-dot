# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
uses [Semantic Versioning](https://semver.org/) — while the major version
is `0`, the public API may still shift between minor versions.

## [0.1.3] - 2026-07-12

### Fixed
- Republished the README. `0.1.2`'s tarball shipped the original scaffold
  README instead of the real one — the Phase 6 rewrite (props table, usage
  examples, theming recipe) had landed in the repo after `0.1.2` was
  published, so it never made it into a tarball. Documentation only, no
  runtime changes — confirmed via a byte-identical tarball diff against
  `0.1.2`.

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
