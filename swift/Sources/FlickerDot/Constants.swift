import SwiftUI

/// Shared geometry, timing and color defaults, namespaced so importing
/// FlickerDot adds no global names. Same values as the React player's
/// `constants.ts`, in Swift units: seconds and points.
public enum Flicker {
    /// Frame advance interval, in seconds (150ms).
    public static let frameInterval: TimeInterval = 0.150
    /// Dot radius in viewBox units.
    public static let dotRadius: Double = 2
    /// Center-to-center spacing in viewBox units.
    public static let pitch: Double = 6
    /// First dot center offset from origin in viewBox units.
    public static let offset: Double = 3
    public static let colsFull = 7
    public static let colsSmall = 5
    public static let dotsFull = 49
    public static let dotsSmall = 25
    public static let viewBoxFull: Double = 42
    public static let viewBoxSmall: Double = 30
    /// Default render size, in points.
    public static let sizeFull: CGFloat = 28
    public static let sizeSmall: CGFloat = 16
    /// #262626
    public static let defaultOn = Color(.sRGB, red: 0x26 / 255, green: 0x26 / 255, blue: 0x26 / 255)
    /// #e5e5e5
    public static let defaultOff = Color(.sRGB, red: 0xE5 / 255, green: 0xE5 / 255, blue: 0xE5 / 255)
    /// Flat indices into a 49-length (7x7) frame that make up the inner 5x5
    /// safe area: rows 1..5, cols 1..5 -> `row * 7 + col`.
    public static let safeAreaIndices: [Int] = (1...5).flatMap { row in (1...5).map { col in row * 7 + col } }
}

/// Extract the inner 5x5 (25 flat) frame from a full 7x7 (49 flat) frame.
/// Missing entries in a short frame read as off.
func toSmallFrame(_ frame: FlickerFrame) -> FlickerFrame {
    Flicker.safeAreaIndices.map { frame.indices.contains($0) && frame[$0] }
}
