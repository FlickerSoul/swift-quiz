---
title: Typed Throws in Closures
difficulty: medium
topics:
  - typed-throws
answer:
  kind: compile-error
---

## Hint

`b()` has typed throws (`throws(E)`), so its thrown errors are statically
known to be `E`. What does the closure in `Result.init(catching:)` infer for its
`Failure` parameter?

## Explanation

Closure should infer its typed throw but it's simply not implemented yet. :')

As per SE-0413:

> Note: the
> [originally accepted version](https://github.com/swiftlang/swift-evolution/blob/821970ae986219f88eb3f950ed787a55ce31d512/proposals/0413-typed-throws.md)
> of this proposal included type inference changes intended for Swift 6.0 that
> were behind the upcoming feature flag FullTypedThrows. These type inference changes did not get implemented in Swift
> 6.0, and have therefore been removed from this proposal and placed into "Future Directions" so they can be revisited
> once implemented.

Function throws have to be explicit, meaning that you will need to type out full throws signature, like the following

```swift
let r = Result { () throws(E) in
 try b()
}
```

See [SE-0413](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0413-typed-throws.md#closure-thrown-type-inference).
