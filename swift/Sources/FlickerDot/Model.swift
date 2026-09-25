import Foundation

enum DotKind: Equatable, Sendable {
    case off
    case onStatic
    case onAnim
}

struct DotModel: Equatable, Sendable {
    let cx: Double
    let cy: Double
    let kind: DotKind
    /// Whether the dot is lit on each frame, in frame order.
    let pattern: [Bool]
    /// Lit at frame 0, which is also what reduced motion holds on.
    var initialOn: Bool { pattern.first ?? false }
}

struct SpinnerModel: Equatable, Sendable {
    let cols: Int
    let viewBox: Double
    /// Frame count.
    let n: Int
    /// One full cycle at speed 1, in seconds.
    let duration: Double
    let dots: [DotModel]
}

/// Compute the render model for a spinner. Pure and framework-agnostic, the
/// Swift counterpart of the React player's `computeModel`: same geometry,
/// same timing, same dot kinds. SwiftUI draws each frame directly, so there
/// are no CSS keyframes to collapse; each dot carries its own `pattern`.
func computeModel(_ grids: FlickerGrids, small: Bool = false) -> SpinnerModel {
    let frames = small ? grids.map(toSmallFrame) : grids
    let n = frames.count
    let cols = small ? Flicker.colsSmall : Flicker.colsFull
    let totalDots = small ? Flicker.dotsSmall : Flicker.dotsFull
    let dots = (0..<totalDots).map { i -> DotModel in
        let pattern = frames.map { $0.indices.contains(i) && $0[i] }
        let kind: DotKind
        if !pattern.contains(true) {
            kind = .off
        } else if !pattern.contains(false) {
            kind = .onStatic
        } else {
            kind = .onAnim
        }
        return DotModel(cx: Double(i % cols) * Flicker.pitch + Flicker.offset,
                        cy: Double(i / cols) * Flicker.pitch + Flicker.offset,
                        kind: kind,
                        pattern: pattern)
    }
    return SpinnerModel(cols: cols,
                        viewBox: small ? Flicker.viewBoxSmall : Flicker.viewBoxFull,
                        n: n,
                        duration: Double(n) * Flicker.frameInterval,
                        dots: dots)
}

/// Which frame is showing after `elapsed` seconds of playback. Frames cut
/// hard every `Flicker.frameInterval / speed`; `speed <= 0` plays at design speed,
/// matching the React player.
func frameIndex(elapsed: TimeInterval, frameCount n: Int, speed: Double = 1, reverse: Bool = false) -> Int {
    guard n > 0 else { return 0 }
    let interval = Flicker.frameInterval / (speed > 0 ? speed : 1)
    // Timeline dates land a hair before each boundary (0.8999999s for 0.9s),
    // and real Date() timestamps only resolve ~1e-7s. A thousandth of a frame
    // absorbs both without ever being visible; any tighter and frames show a
    // tick late.
    let step = Int((max(elapsed, 0) / interval + 1e-3).rounded(.down)) % n
    return reverse ? n - 1 - step : step
}
