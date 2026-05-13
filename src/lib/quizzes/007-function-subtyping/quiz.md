---
title: Function Subtyping
difficulty: medium
topics:
  - functions
  - inheritance
answer:
  kind: prints
  output: B
---

## Hint

Swift permits the assignment `g = f` because function types are
contravariant in their parameters and covariant in their result. Which
way does each direction go here?

## Explanation

`B` is a subclass of `A`, so `B <: A`. Function subtyping inverts this for
parameters and preserves it for results:

```
(A) -> B   <:   (B) -> A
   │              │
   │              └─ result type: B <: A   (covariant)
   └─ parameter type: A is allowed where B is expected   (contravariant)
```

So `f: (A) -> B` _is_ a `(B) -> A` from the caller's point of view — any
caller passing a `B` is passing a valid `A`, and any caller expecting an
`A` is happy to receive a `B`. Swift inserts the bridging thunk
automatically, no cast needed.

At runtime, calling `g(B())` invokes the underlying closure, which still
returns a fresh `B`. `type(of:)` reports the dynamic type, so the output
is `B` (not `A`), even though `g`'s static return type is `A`.

This is one of the few places where Swift's type system actively bends a
function to fit a wider hole. The reverse assignment

```swift
var h: (A) -> B = g   // error
```

does _not_ type-check — `g` only promises to return an `A`, which is
weaker than a `B`, and accepts only a `B`-or-subclass, which is stronger
than an `A`.
