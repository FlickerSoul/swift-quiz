---
title: consuming on a Copyable Struct
difficulty: medium
topics:
  - ownership
  - functions
answer:
  kind: prints
  output: |
    0
    1
---

## Hint

`consuming` on a `~Copyable` value transfers ownership. What can it possibly
mean on an ordinary value-type that _is_ `Copyable`?

## Explanation

On a `~Copyable` type, `consuming` is load-bearing: it transfers ownership
to the callee and ends the caller's access to the value. The caller can't
use the variable anymore after the call.

On a plain `Copyable` `struct` like `Point`, ownership doesn't really exist
as a constraint — the type freely copies. `consuming` here means "the
callee gets its own mutable copy of `self`, separate from the caller's
binding." The caller's `p` is **copied** into the call, the body mutates
_that_ copy (`self.x += 1`), and returns it. The original `p` is never
touched.

So:

- `p.x` is still `0` — `p` is a `let` and is unchanged.
- `q.x` is `1` — `q` is the returned, mutated copy.

If you want a method that mutates the caller's storage in place, use
`mutating` (and bind to a `var`). `consuming` on a `Copyable` type is
mostly useful as a _hint_ — it signals that the body is going to mutate
`self` for its own purposes, and you should treat the call site as
"throwing away" the input value.
