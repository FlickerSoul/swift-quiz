---
title: Re-stated Protocol Requirement
difficulty: hard
topics:
  - protocols
  - dispatch
answer:
  kind: prints
  output: |
    ext-Q
    ext-Q
    ext-Q
---

## Hint

`P` requires `f`. `Q: P` *also* requires `f`. `S: Q` doesn't implement
either. With two defaults in scope (one on `P`, one on `Q`), which one
becomes the witness for `S`'s conformance to `P`?

## Explanation

Re-stating a requirement in a refining protocol looks redundant, but it
has a real effect: it asks the compiler to **pick a witness for `Q.f`
separately from `P.f`** when a type adopts `Q`. The witness-resolution
search runs in the conforming type's most-refined context — for `S`,
that's `S: Q`, which makes `extension Q`'s default a candidate. It's the
most-specific candidate, so it wins. The compiler then uses *the same
implementation* to satisfy `S`'s inherited `P.f` witness.

So:

```
S().f()          // direct: extension Q's default            → ext-Q
(S() as P).f()   // witness for P.f on S = extension Q's f   → ext-Q
(S() as Q).f()   // witness for Q.f on S = extension Q's f   → ext-Q
```

If you *remove* the re-statement from `Q`, the picture changes:

```swift
protocol Q: P {}                  // no longer re-stating f
extension Q { func f() { print("ext-Q") } }
struct S: Q {}
(S() as P).f()                    // → "ext-P", not "ext-Q"
```

Now `Q`'s `f` is just an extension method, not a requirement. The
witness for `P.f` on `S` is still filled (because `S` conforms to `P`
transitively), but the compiler picks it from the *unrefined* `P`
extensions — which means the default `ext-P` wins.

Re-stating is the trick used in the standard library (e.g.
`Collection.count`) when a refining protocol wants to provide a stronger
default that should also flow back through the base-protocol's witness
table.
