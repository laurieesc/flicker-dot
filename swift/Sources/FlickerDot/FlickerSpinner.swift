import SwiftUI

public enum FlickerVariant: String, Sendable {
    case grid7x7 = "7x7"
    case grid5x5 = "5x5"
}

public struct FlickerTheme: Sendable {
    public var on: Color
    public var off: Color

    public init(on: Color, off: Color) {
        self.on = on
        self.off = off
    }
}

/// Flicker dot-grid loading spinner for SwiftUI. Each frame is drawn in a
/// single `Canvas` pass and cuts hard on a periodic timeline, with no eased
/// fades between frames. Honors Reduce Motion by holding on frame 0.
///
/// Colors are plain SwiftUI `Color`s, so semantic and asset-catalog colors
/// (`.primary`, `.secondary`, `Color("Accent")`) follow light/dark mode
/// with no extra plumbing.
public struct FlickerSpinner: View {
    private let model: SpinnerModel
    private let onColor: Color
    private let offColor: Color
    private let size: CGFloat
    private let playing: Bool
    private let speed: Double
    private let reverse: Bool
    private let title: String

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var clock: PlaybackClock

    /// - Parameters:
    ///   - grids: Ordered frames; each frame is a flat 49-boolean (7x7) array.
    ///   - onColor: ON dot color. Default #262626.
    ///   - offColor: OFF dot color. Default #e5e5e5.
    ///   - theme: Convenience ON/OFF pair. Explicit `onColor`/`offColor` take precedence.
    ///   - variant: Render the full 7x7 or the derived inner 5x5. Default `.grid7x7`.
    ///   - size: Render size in points. Defaults to 28 (7x7) / 16 (5x5).
    ///   - playing: Whether the animation runs. Pausing holds the current frame. Default true.
    ///   - speed: Playback rate multiplier. 1 = design speed (150ms/frame). Default 1.
    ///   - reverse: Play frames in reverse. Default false.
    ///   - title: Accessibility label. Default "Loading".
    public init(grids: FlickerGrids,
                onColor: Color? = nil,
                offColor: Color? = nil,
                theme: FlickerTheme? = nil,
                variant: FlickerVariant = .grid7x7,
                size: CGFloat? = nil,
                playing: Bool = true,
                speed: Double = 1,
                reverse: Bool = false,
                title: String = "Loading") {
        let small = variant == .grid5x5
        self.model = computeModel(grids, small: small)
        self.onColor = onColor ?? theme?.on ?? DEFAULT_ON
        self.offColor = offColor ?? theme?.off ?? DEFAULT_OFF
        self.size = size ?? (small ? SIZE_SMALL : SIZE_FULL)
        self.playing = playing
        self.speed = speed
        self.reverse = reverse
        self.title = title
        let now = Date()
        self._clock = State(initialValue: PlaybackClock(origin: now, pausedAt: playing ? nil : now))
    }

    public var body: some View {
        Group {
            if reduceMotion || model.n < 2 {
                frame(0)
            } else if playing {
                TimelineView(.periodic(from: clock.origin, by: FRAME_INTERVAL / (speed > 0 ? speed : 1))) { context in
                    frame(index(at: context.date))
                }
            } else {
                frame(index(at: Date()))
            }
        }
        .frame(width: size, height: size)
        .onChange(of: playing) { playing in
            if playing { clock.resume(at: Date()) } else { clock.pause(at: Date()) }
        }
        .accessibilityElement()
        .accessibilityLabel(Text(title))
        .accessibilityAddTraits(.isImage)
    }

    private func index(at date: Date) -> Int {
        frameIndex(elapsed: clock.elapsed(at: date), frameCount: model.n, speed: speed, reverse: reverse)
    }

    private func frame(_ index: Int) -> some View {
        FlickerFrameView(model: model, frame: index, onColor: onColor, offColor: offColor)
    }
}

/// One frame of a spinner: an OFF backing dot for every position, with the
/// ON dot drawn over it where lit, like the React player's two layers.
struct FlickerFrameView: View {
    let model: SpinnerModel
    let frame: Int
    let onColor: Color
    let offColor: Color

    var body: some View {
        Canvas { context, size in
            // Scale the square viewBox to fit, centered (SVG's xMidYMid meet).
            let scale = min(size.width, size.height) / model.viewBox
            let origin = CGPoint(x: (size.width - model.viewBox * scale) / 2,
                                 y: (size.height - model.viewBox * scale) / 2)
            for dot in model.dots {
                let rect = CGRect(x: origin.x + (dot.cx - DOT_R) * scale,
                                  y: origin.y + (dot.cy - DOT_R) * scale,
                                  width: DOT_R * 2 * scale, height: DOT_R * 2 * scale)
                let circle = Path(ellipseIn: rect)
                context.fill(circle, with: .color(offColor))
                if dot.pattern.indices.contains(frame) && dot.pattern[frame] {
                    context.fill(circle, with: .color(onColor))
                }
            }
        }
    }
}

/// Playback time that can pause and resume where it left off, like a CSS
/// animation's play state.
struct PlaybackClock: Equatable {
    var origin: Date
    var pausedAt: Date?

    func elapsed(at date: Date) -> TimeInterval {
        (pausedAt ?? date).timeIntervalSince(origin)
    }

    mutating func pause(at date: Date) {
        guard pausedAt == nil else { return }
        pausedAt = date
    }

    mutating func resume(at date: Date) {
        guard let pausedAt else { return }
        origin = date.addingTimeInterval(-pausedAt.timeIntervalSince(origin))
        self.pausedAt = nil
    }
}
