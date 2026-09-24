import SwiftUI

/// Frame advance interval, seconds (150ms, as in the React player).
public let FRAME_INTERVAL: Double = 0.150
/// Dot radius in viewBox units.
public let DOT_R: Double = 2
/// Center-to-center spacing in viewBox units.
public let PITCH: Double = 6
/// First dot center offset from origin in viewBox units.
public let OFFSET: Double = 3
public let COLS_FULL = 7
public let COLS_SMALL = 5
public let DOTS_FULL = 49
public let DOTS_SMALL = 25
public let VIEWBOX_FULL: Double = 42
public let VIEWBOX_SMALL: Double = 30
/// Default render size in points.
public let SIZE_FULL: CGFloat = 28
public let SIZE_SMALL: CGFloat = 16
/// #262626
public let DEFAULT_ON = Color(.sRGB, red: 0x26 / 255, green: 0x26 / 255, blue: 0x26 / 255)
/// #e5e5e5
public let DEFAULT_OFF = Color(.sRGB, red: 0xE5 / 255, green: 0xE5 / 255, blue: 0xE5 / 255)

/// Flat indices into a 49-length (7x7) frame that make up the inner 5x5 safe
/// area: rows 1..5, cols 1..5 -> `row * 7 + col`.
public let SAFE_AREA_INDICES: [Int] = (1...5).flatMap { row in (1...5).map { col in row * 7 + col } }

/// Extract the inner 5x5 (25 flat) frame from a full 7x7 (49 flat) frame.
/// Missing entries in a short frame read as off.
public func toSmallFrame(_ frame: FlickerFrame) -> FlickerFrame {
    SAFE_AREA_INDICES.map { frame.indices.contains($0) && frame[$0] }
}
