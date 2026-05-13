---
title: Result.init and Typed Throws
difficulty: medium
topics:
  - typed-throws
answer:
  kind: compile-error
---

## Hint

`b()` has typed throws (`throws(E)`), so its thrown errors are statically
known to be `E`. What does `Result.init(catching:)` infer for its
`Failure` parameter from a `throws(E)` closure?

## Explanation

The standard library has a single initializer:

```swift
extension Result where Failure == any Error {
  public init(catching body: () throws -> Success)
}
```

That `where Failure == any Error` clause is the killer. The initializer is
only available when `Failure` is the fully type-erased `any Error`, so the
inferred type of `Result { try b() }` is `Result<Int, any Error>` —
**not** `Result<Int, E>`. Passing it to `requirement(_:)` then fails:

```
error: cannot convert value of type 'Result<Int, any Error>'
       to expected argument type 'Result<Int, E>'
note: arguments to generic parameter 'Failure'
      ('any Error' and 'E') are expected to be equal
```

Typed throws (SE-0413) added the syntax `throws(E)`, but the
`Result.init(catching:)` overload that would preserve `E` hasn't been
added to the standard library yet. Until it is, you have to construct the
`Result<Int, E>` by hand:

```swift
let r: Result<Int, E>
do {
  r = .success(try b())
} catch {
  r = .failure(error)   // `error` is already typed as `E`
}
requirement(r)
```

Or, if you don't care about preserving the error type:

```swift
let r = Result { try b() }            // Result<Int, any Error>
let typed = r.mapError { $0 as! E }   // unsafe but explicit
```
