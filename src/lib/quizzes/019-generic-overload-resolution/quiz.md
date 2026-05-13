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

`Test` conforms to both `A` and `B`. What would `inner` see when it's called?

## Explanation

Overload resolution is **static** and runs in the context that's
type-checking the call — here, the body of `outer<T: A>(_:)`.

Inside `outer`, the compiler only knows about `T` what `outer`'s
constraint clause says: `T: A`. The `T: A & B` overload of `inner`
requires the caller to know `T: B` _at the point of the call_. Inside
`outer`, that knowledge isn't available, so the `T: A & B` overload is
not applicable, even though we are passing the type across and would know the concrete type at each call site. The only
candidate is `allow<T: A>`, which prints `"A only"`.
