// swift-tools-version: 5.9
//
// The SwiftUI player lives in swift/. This manifest sits at the repo root
// because Swift Package Manager only resolves packages from a repository's
// root; npm ignores it (package.json publishes dist/ only).
import PackageDescription

let package = Package(
    name: "FlickerDot",
    platforms: [.iOS(.v15), .macOS(.v12), .tvOS(.v15), .watchOS(.v8), .visionOS(.v1)],
    products: [
        .library(name: "FlickerDot", targets: ["FlickerDot"]),
    ],
    targets: [
        .target(name: "FlickerDot", path: "swift/Sources/FlickerDot"),
        .testTarget(name: "FlickerDotTests", dependencies: ["FlickerDot"], path: "swift/Tests/FlickerDotTests"),
    ]
)
