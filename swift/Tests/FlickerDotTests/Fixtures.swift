import FlickerDot

// Same fixtures as test/fixtures.ts, so both players are checked against
// identical frame data.

/// n frames, every dot off in every frame.
func allOff(_ n: Int) -> FlickerGrids {
    Array(repeating: Array(repeating: false, count: DOTS_FULL), count: n)
}

/// n frames, every dot on in every frame.
func allOn(_ n: Int) -> FlickerGrids {
    Array(repeating: Array(repeating: true, count: DOTS_FULL), count: n)
}

/// n frames; dot `d` is lit only on frame index 1, off everywhere else.
func singleDot(_ d: Int, _ n: Int = 4) -> FlickerGrids {
    (0..<n).map { f in (0..<DOTS_FULL).map { i in f == 1 && i == d } }
}

/// n frames, checkerboard pattern that also shifts by frame.
func alternating(_ n: Int = 4) -> FlickerGrids {
    (0..<n).map { f in (0..<DOTS_FULL).map { i in (i % COLS_FULL + i / COLS_FULL + f) % 2 == 0 } }
}

/// 6 frames: one always-on dot (index 24, the 7x7 center) plus a column
/// sweep — each column lights up on exactly one frame, so most dots are
/// on-anim, column 6 never fires (off), and dot 24 is on-static.
func mixed() -> FlickerGrids {
    (0..<6).map { f in (0..<DOTS_FULL).map { i in i == 24 || i % COLS_FULL == f % COLS_FULL } }
}
