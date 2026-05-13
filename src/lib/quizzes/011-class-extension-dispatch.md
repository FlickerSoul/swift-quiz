---
title: Protocol Defaults Through Class Inheritance
difficulty: hard
topics:
  - protocols
  - dispatch
  - inheritance
answer:
  kind: prints
  output: |
    A
    A
    P
    P
    C
    P
---

## Hint

When a class conforms to a protocol but doesn't implement a requirement,
the compiler fills the witness slot with the protocol's default. That
choice is *frozen* at the point of the conformance declaration. What
does that mean for a subclass that later defines its own `foo()`?

## Explanation

Two dispatch mechanisms collide here:

- **Class virtual dispatch.** `class C: B { func foo() }` overrides
  `B.foo` virtually, so a direct call `C().foo()` finds `C`'s
  implementation through `C`'s vtable.
- **Protocol witness dispatch.** Whoever declares the conformance — `B`,
  in this case — picks the witness for `foo` *once*, when the
  conformance is recorded. `B` itself didn't implement `foo`, so its
  witness for `P.foo` is the protocol-extension default `"P"`.

Now read each line:

```
A().foo()              // A.foo() directly                       → "A"
(A() as P).foo()       // P-witness for A = A.foo()              → "A"
B().foo()              // B has no foo(); extension P provides   → "P"
(B() as P).foo()       // P-witness for B = extension default    → "P"
C().foo()              // C's class method overrides B.foo;      → "C"
                       // but B inherited "P" only as the witness,
                       // not as a class method, so C is unambiguous.
(C() as P).foo()       // P-witness inherited from B = extension → "P"
```

The last line is the gotcha. `C` overrides `foo` as a regular method, so
`C().foo()` goes through the class vtable to `C.foo`. But the
protocol-witness table for `P` was wired up when **`B`** adopted the
conformance, and that witness slot was filled with the protocol
extension's default. `C` doesn't get a new witness table; it inherits
`B`'s. So routing through `as P` lands on `"P"`, not `"C"`.

The fix, if you want `C`'s implementation to win through `P` too, is to
declare the conformance on `C` (or on `B` with the override pattern that
calls the subclass's method). Most code that hits this just makes `foo`
a requirement and implements it explicitly on `B`.
