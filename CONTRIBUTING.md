# Contributing to flicker-dot

This is a small, focused package, and it's meant to stay that way. If
you're filing a bug or looking into a PR, here's what to know first.

## Before you open a PR

A quick check for fit: `flicker-dot` is the player. It renders frame data
that's already been designed. It does not generate spinner patterns,
export code in other formats, or do anything at design-time. That layer
lives in the Flicker app and isn't part of this repo. If your change adds
that kind of surface area, open an issue first and let's talk about
whether it belongs here before you write code.

## Setup

```bash
git clone https://github.com/laurieesc/flicker-dot.git
cd flicker-dot
npm install
```

## Running the tests

```bash
npm test
```

Every PR runs this in CI automatically. A green check is required before
merge. If you're changing `computeModel` or `<FlickerSpinner>`, add or
update a test alongside the change rather than after; a behavior change
with no corresponding test is the fastest way to get asked for one.

### Swift

```bash
swift test
```

The SwiftUI player lives in `swift/`, with `Package.swift` at the repo root
because Swift Package Manager only reads manifests from there. It mirrors
the React player: geometry and timing in `Constants.swift` and
`computeModel`, rendering in `FlickerSpinner.swift`. A change to one
player's behavior should land in the other, with tests on both sides.

## Building

```bash
npm run build
```

This runs `tsup` for the JS bundle and `tsc --emitDeclarationOnly` for
type declarations, both from `src/` into `dist/`. You shouldn't need to
run this locally to contribute. CI builds on every PR, but it's here if
you want to sanity-check output before pushing.

## Code style

- No new runtime dependencies without a real reason. This package is
  zero-dependency by design (`react` is a peer, not a dependency), and
  that's a feature worth protecting.
- Geometry, timing, and keyframe math live in `computeModel` and
  `constants.ts`, not re-derived in the component. If you're about to type
  a `6`, a `3`, or a hardcoded viewBox number, it probably belongs in
  `constants.ts` instead.
- Tests go in `test/`, not `src/`. The build's `--rootDir src` would
  otherwise emit test declarations into the published package.

## A note on naming

"Flicker" and "flicker-dot" are the project's names. Please don't use them
to imply an official or endorsed integration unless it's discussed with
the maintainer first. Otherwise: build things, have fun, tag an issue if
you're not sure where something belongs.

## Reporting bugs

Open an issue with a minimal reproduction, a code sandbox or a short
snippet showing the `grids` input and what rendered versus what you
expected. "It looks wrong" is hard to fix; "dot 12 should be off on frame
3 and it's on" is easy to fix.
