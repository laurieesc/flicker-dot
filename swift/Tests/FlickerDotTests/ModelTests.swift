import Foundation
import Testing
@testable import FlickerDot

@Suite struct ModelTests {
    @Test func duration() {
        for n in [1, 3, 4, 6, 10] {
            #expect(abs((computeModel(allOff(n)).duration) - (Double(n) * 0.150)) < 1e-9)
        }
    }

    @Test func geometry7x7() {
        let dots = computeModel(allOff(1)).dots
        #expect(dots.count == DOTS_FULL)
        #expect(dots[0].cx == 3 && dots[0].cy == 3) // top-left
        #expect(dots[6].cx == 39 && dots[6].cy == 3) // top-right
        #expect(dots[42].cx == 3 && dots[42].cy == 39) // bottom-left
        #expect(dots[48].cx == 39 && dots[48].cy == 39) // bottom-right
        #expect(dots[24].cx == 21 && dots[24].cy == 21) // center
        #expect(computeModel(allOff(1)).viewBox == VIEWBOX_FULL)
    }

    @Test func geometry5x5() {
        let model = computeModel(allOff(1), small: true)
        let dots = model.dots
        #expect(dots.count == DOTS_SMALL)
        #expect(model.viewBox == VIEWBOX_SMALL)
        #expect(dots[0].cx == 3 && dots[0].cy == 3)
        #expect(dots[4].cx == 27 && dots[4].cy == 3)
        #expect(dots[20].cx == 3 && dots[20].cy == 27)
        #expect(dots[24].cx == 27 && dots[24].cy == 27)
        #expect(dots[12].cx == 15 && dots[12].cy == 15)
    }

    @Test func kinds() {
        #expect(computeModel(allOff(4)).dots.allSatisfy { $0.kind == .off })
        #expect(computeModel(allOn(4)).dots.allSatisfy { $0.kind == .onStatic })

        let single = computeModel(singleDot(24)).dots
        #expect(single.filter { $0.kind == .onAnim }.count == 1)
        #expect(single[24].kind == .onAnim)
        #expect(!single[24].initialOn)
        #expect(single.filter { $0.kind == .off }.count == DOTS_FULL - 1)

        let mixed = computeModel(mixed()).dots
        #expect(mixed[24].kind == .onStatic)
        #expect(mixed[6].kind == .off) // column 6 never fires
        #expect(mixed[0].kind == .onAnim)
    }

    @Test func patternsFollowFrames() {
        let grids = alternating(4)
        for (i, dot) in computeModel(grids).dots.enumerated() {
            #expect(dot.pattern == grids.map { $0[i] })
        }
    }

    @Test func smallModelReadsTheSafeArea() {
        let grids = alternating(3)
        let small = computeModel(grids, small: true)
        for (i, dot) in small.dots.enumerated() {
            #expect(dot.pattern == grids.map { $0[SAFE_AREA_INDICES[i]] })
        }
    }

    @Test func smallFrame() {
        let frame = (0..<DOTS_FULL).map { $0 % 2 == 0 }
        let small = FlickerDot.toSmallFrame(frame)
        #expect(small.count == 25)
        #expect(small == SAFE_AREA_INDICES.map { frame[$0] })
    }

    @Test func safeAreaIndices() {
        #expect(SAFE_AREA_INDICES.count == 25)
        #expect(SAFE_AREA_INDICES.min() == 8)
        #expect(SAFE_AREA_INDICES.max() == 40)
    }

    @Test func malformedGridsDoNotCrash() {
        #expect(computeModel([]).n == 0)
        #expect(computeModel([]).dots.allSatisfy { $0.kind == .off })
        let short = computeModel([[true], []])
        #expect(short.dots[0].pattern == [true, false])
        #expect(short.dots[1].kind == .off)
        #expect(FlickerDot.toSmallFrame([true]) == Array(repeating: false, count: 25))
    }
}
