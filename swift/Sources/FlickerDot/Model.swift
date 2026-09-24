import Foundation

public enum DotKind: Equatable, Sendable {
    case off
    case onStatic
    case onAnim
}

public struct DotModel: Equatable, Sendable {
    public let cx: Double
    public let cy: Double
    public let kind: DotKind
    /// Whether the dot is lit on each frame, in frame order.
    public let pattern: [Bool]
    /// Lit at frame 0, which is also what reduced motion holds on.
    public var initialOn: Bool { pattern.first ?? false }
}

public struct SpinnerModel: Equatable, Sendable {
    public let cols: Int
    public let viewBox: Double
    /// Frame count.
    public let n: Int
    /// One full cycle at speed 1, in seconds.
    public let duration: Double
    public let dots: [DotModel]
}

/// Compute the render model for a spinner. Pure and framework-agnostic, the
/// Swift counterpart of the React player's `computeModel`: same geometry,
/// same timing, same dot kinds. SwiftUI draws each frame directly, so there
/// are no CSS keyframes to collapse; each dot carries its own `pattern`.
public func computeModel(_ grids: FlickerGrids, small: Bool = false) -> SpinnerModel {
    let frames = small ? grids.map(toSmallFrame) : grids
    let n = frames.count
    let cols = small ? COLS_SMALL : COLS_FULL
    let totalDots = small ? DOTS_SMALL : DOTS_FULL
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
        return DotModel(cx: Double(i % cols) * PITCH + OFFSET,
                        cy: Double(i / cols) * PITCH + OFFSET,
                        kind: kind,
                        pattern: pattern)
    }
    return SpinnerModel(cols: cols,
                        viewBox: small ? VIEWBOX_SMALL : VIEWBOX_FULL,
                        n: n,
                        duration: Double(n) * FRAME_INTERVAL,
                        dots: dots)
}

/// Which frame is showing after `elapsed` seconds of playback. Frames cut
/// hard every `FRAME_INTERVAL / speed`; `speed <= 0` plays at design speed,
/// matching the React player.
public func frameIndex(elapsed: TimeInterval, frameCount n: Int, speed: Double = 1, reverse: Bool = false) -> Int {
    guard n > 0 else { return 0 }
    let interval = FRAME_INTERVAL / (speed > 0 ? speed : 1)
    // Timeline dates land a hair before each boundary (0.8999999s for 0.9s);
    // without the tolerance every frame would show one tick late.
    let step = Int((max(elapsed, 0) / interval + 1e-6).rounded(.down)) % n
    return reverse ? n - 1 - step : step
}
