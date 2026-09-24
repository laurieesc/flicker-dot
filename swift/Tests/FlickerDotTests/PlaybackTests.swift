import Foundation
import Testing
@testable import FlickerDot

@Suite struct PlaybackTests {
    @Test func framesCutEvery150ms() {
        #expect(frameIndex(elapsed: 0, frameCount: 4) == 0)
        #expect(frameIndex(elapsed: 0.149, frameCount: 4) == 0)
        #expect(frameIndex(elapsed: 0.151, frameCount: 4) == 1)
        #expect(frameIndex(elapsed: 0.45 + 0.001, frameCount: 4) == 3)
        #expect(frameIndex(elapsed: 0.6 + 0.001, frameCount: 4) == 0) // loops
    }

    @Test func boundariesToleratePrecisionLoss() {
        // What TimelineView actually hands back for the 1st and 6th boundaries.
        #expect(frameIndex(elapsed: 0.14999999403953552, frameCount: 6) == 1)
        #expect(frameIndex(elapsed: 0.8999999761581421, frameCount: 6) == 0)
    }

    @Test func speed() {
        #expect(frameIndex(elapsed: 0.076, frameCount: 4, speed: 2) == 1)
        #expect(frameIndex(elapsed: 0.151, frameCount: 4, speed: 0.5) == 0)
        // speed <= 0 plays at design speed, like the React player.
        #expect(frameIndex(elapsed: 0.151, frameCount: 4, speed: 0) == 1)
        #expect(frameIndex(elapsed: 0.151, frameCount: 4, speed: -3) == 1)
    }

    @Test func reverse() {
        // CSS animation-direction: reverse starts at the 100% stop, the last frame.
        #expect(frameIndex(elapsed: 0, frameCount: 4, reverse: true) == 3)
        #expect(frameIndex(elapsed: 0.151, frameCount: 4, reverse: true) == 2)
        #expect(frameIndex(elapsed: 0.601, frameCount: 4, reverse: true) == 3)
    }

    @Test func emptyAndNegative() {
        #expect(frameIndex(elapsed: 5, frameCount: 0) == 0)
        #expect(frameIndex(elapsed: -1, frameCount: 4) == 0)
    }

    @Test func clockPausesAndResumesWhereItLeftOff() {
        let start = Date(timeIntervalSinceReferenceDate: 0)
        var clock = PlaybackClock(origin: start)
        #expect(abs((clock.elapsed(at: start + 0.3)) - (0.3)) < 1e-9)

        clock.pause(at: start + 0.3)
        #expect(abs((clock.elapsed(at: start + 5)) - (0.3)) < 1e-9)
        clock.pause(at: start + 4) // already paused: keeps the first pause
        #expect(abs((clock.elapsed(at: start + 5)) - (0.3)) < 1e-9)

        clock.resume(at: start + 10)
        #expect(abs((clock.elapsed(at: start + 10)) - (0.3)) < 1e-9)
        #expect(abs((clock.elapsed(at: start + 10.2)) - (0.5)) < 1e-9)
    }

    @Test func clockStartingPausedBeginsAtZero() {
        let start = Date(timeIntervalSinceReferenceDate: 0)
        var clock = PlaybackClock(origin: start, pausedAt: start)
        #expect(clock.elapsed(at: start + 3) == 0)
        clock.resume(at: start + 3)
        #expect(abs((clock.elapsed(at: start + 3.1)) - (0.1)) < 1e-9)
    }
}
