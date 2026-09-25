/// Canonical Flicker spinner data shape.
///
/// A spinner is an ordered list of frames. Each frame is a FLAT boolean array:
///   - 7x7 spinners: 49 booleans, indexed `row * 7 + col`
///   - the inner 5x5 is DERIVED from the 7x7 (see `toSmallFrame`), never stored
///
/// This is the one shape the whole system agrees on, and it's the same JSON
/// the Flicker editor exports for the React player, so
/// `JSONDecoder().decode(FlickerGrids.self, from: data)` reads it directly.
/// Do not introduce a rows x cols (`[[[Bool]]]`) variant.
public typealias FlickerFrame = [Bool]
public typealias FlickerGrids = [FlickerFrame]
