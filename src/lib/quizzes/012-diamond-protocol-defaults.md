---
title: Diamond Default
difficulty: medium
topics:
  - protocols
  - dispatch
answer:
  kind: prints
  output: Q
---

## Hint

Neither `P` nor `Q` declares `f` as a requirement, and `Q` refines `P`.
Which extension's default is the compiler going to pick when both are in
scope for `S`?

## Explanation

`S` conforms to both `P` and `Q`, and _both_ extensions provide an
unsolicited `f()`. Neither one is a requirement (so there's no witness
table to consult). Static dispatch has to pick one of them.

Swift's rule is **most-refined wins**. `Q` refines `P` (`Q: P`), so any
extension on `Q` is more specific than an extension on `P` for a type
that conforms to `Q`. The compiler binds `S().f()` to `extension Q`'s
default — `"Q"`.

If the two protocols had been _unrelated_, this same code would have been
ambiguous and failed to compile:

```swift
protocol P {}
extension P { func f() { print("P") } }
protocol Q {}                       // no longer refines P
extension Q { func f() { print("Q") } }
struct S: P, Q {}
S().f()   // error: ambiguous use of 'f'
```

So the diamond shape isn't incidental — it's _what_ gives the compiler a
total order. Refinement is the tie-breaker.

And as in the previous quiz, the moment you turn `f` into a requirement
on either `P` or `Q`, the rules change again: a witness must be picked,
and "most-refined extension" no longer applies the same way.
