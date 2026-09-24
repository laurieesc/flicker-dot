import Foundation
import SwiftUI
import Testing
@testable import FlickerDot

/// Renders frames to pixels and checks each dot center against the model,
/// the SwiftUI counterpart of the React suite's "render agrees with model".
@MainActor
@Suite struct RenderTests {
    private let on = Color(.sRGB, red: 1, green: 0, blue: 0)
    private let off = Color(.sRGB, red: 0, green: 0, blue: 1)

    @Test func everyDotMatchesTheModel() throws {
        guard #available(iOS 16, macOS 13, tvOS 16, watchOS 9, *) else { return } // ImageRenderer
        let fixtures: [String: FlickerGrids] = [
            "allOff": allOff(4), "allOn": allOn(4), "singleDot": singleDot(24),
            "alternating": alternating(4), "mixed": mixed(),
        ]
        for (name, grids) in fixtures {
            for small in [false, true] {
                let model = computeModel(grids, small: small)
                for frame in 0..<model.n {
                    let pixels = try render(model: model, frame: frame, size: 84)
                    let scale = 84 / model.viewBox
                    for (i, dot) in model.dots.enumerated() {
                        let lit = pixels.isRed(x: Int(dot.cx * scale), y: Int(dot.cy * scale))
                        #expect(lit == dot.pattern[frame], "\(name) small=\(small) frame \(frame) dot \(i)")
                    }
                }
            }
        }
    }

    @Test func spinnerDefaultsToDesignSize() {
        guard #available(iOS 16, macOS 13, tvOS 16, watchOS 9, *) else { return } // ImageRenderer
        let full = ImageRenderer(content: FlickerSpinner(grids: allOn(1)))
        let small = ImageRenderer(content: FlickerSpinner(grids: allOn(1), variant: .grid5x5))
        #expect(full.cgImage.map { CGSize(width: $0.width, height: $0.height) } == CGSize(width: SIZE_FULL, height: SIZE_FULL))
        #expect(small.cgImage.map { CGSize(width: $0.width, height: $0.height) } == CGSize(width: SIZE_SMALL, height: SIZE_SMALL))
    }

    @Test func colorPrecedence() throws {
        guard #available(iOS 16, macOS 13, tvOS 16, watchOS 9, *) else { return } // ImageRenderer
        let theme = FlickerTheme(on: .green, off: .green)
        let explicit = ImageRenderer(content: FlickerSpinner(grids: allOn(1), onColor: on, offColor: off, theme: theme, size: 84))
        let pixels = try #require(explicit.cgImage.map(Pixels.init))
        #expect(pixels.isRed(x: 42, y: 42)) // explicit onColor beats theme
    }

    @available(iOS 16, macOS 13, tvOS 16, watchOS 9, *)
    private func render(model: SpinnerModel, frame: Int, size: CGFloat) throws -> Pixels {
        let view = FlickerFrameView(model: model, frame: frame, onColor: on, offColor: off)
            .frame(width: size, height: size)
        return try #require(ImageRenderer(content: view).cgImage.map(Pixels.init))
    }
}

private struct Pixels {
    let width: Int
    let data: [UInt8]

    init(_ image: CGImage) {
        width = image.width
        var data = [UInt8](repeating: 0, count: image.width * image.height * 4)
        let context = CGContext(data: &data, width: image.width, height: image.height, bitsPerComponent: 8,
                                bytesPerRow: image.width * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
        self.data = data
    }

    func isRed(x: Int, y: Int) -> Bool {
        let i = (y * width + x) * 4
        return data[i] > 200 && data[i + 2] < 50
    }
}
