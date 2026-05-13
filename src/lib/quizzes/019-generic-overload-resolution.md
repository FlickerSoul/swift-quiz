---
title: Overload Resolution in a Generic Context
difficulty: medium
topics:
  - generics
  - overload-resolution
  - protocols
answer:
  kind: prints
  output: A only
---

## Hint

`Test` conforms to both `A` and `B`. So why doesn't `allow(val)` inside
`outer` pick the more specific overload?

## Explanation

Overload resolution is **static** and runs in the context that's
type-checking the call — here, the body of `outer<T: A>(_:)`.

Inside `outer`, the compiler only knows about `T` what `outer`'s
constraint clause says: `T: A`. The `T: A & B` overload of `allow`
requires the caller to know `T: B` _at the point of the call_. Inside
`outer`, that knowledge isn't available, so the `T: A & B` overload is
not applicable. The only candidate is `allow<T: A>`, which prints
`"A only"`.

The crucial thing is that this decision is **baked in at the time `outer`
is compiled.** Even though at the use site

```swift
outer(Test.self)
```

the compiler can see that `Test: A & B`, that information doesn't
propagate into the already-compiled body of `outer`. `outer` was
written with `T: A` and was bound to the `A`-only overload there.

To get the more specific overload to win, you need the constraint _at
the call site_:

```swift
func outer<T: A & B>(_ val: T.Type) {
  allow(val)            // now binds to the A & B overload
}
```

Or call `allow` directly: `allow(Test.self)` prints `"A & B"`.

This pattern shows up in real codebases as the "generic dispatch
boundary" problem: a generic helper that's been written against a weak
constraint can never opportunistically use a stronger overload, even
when the concrete type would satisfy it. Some libraries work around this
with runtime checks (`if let x = val as? B.Type`) — others use
`@_specialize` or duplicate the helper for different constraint sets.
