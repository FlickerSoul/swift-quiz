---
title: Conditional Default
difficulty: medium
topics:
  - conditional-conformance
  - protocols
  - dispatch
answer:
  kind: prints
  output: |
    2
    1
---

## Hint

Both extensions define `value()`. Each conforming type sees zero, one, or
both of them depending on the constraint clause. What does the compiler
pick when both are visible?

## Explanation

There are two extensions of `P`:

- `extension P` — always applicable; default returns `1`.
- `extension P where Self: Equatable` — applicable only if the conformer
  also conforms to `Equatable`; default returns `2`.

For `S: P, Equatable`, both extensions are visible. Swift's rule:
**the more constrained extension wins.** `where Self: Equatable` is
strictly stronger than the unconstrained version, so `S().value()` binds
to `extension P where Self: Equatable` → `2`.

For `T: P` (no `Equatable`), only the unconstrained extension applies,
so `T().value()` → `1`.

This is the same "most-refined wins" rule as the previous quiz, but the
refinement is on the constraint clause instead of on protocol
inheritance. Together they cover almost every dispatch puzzle you'll
see: when multiple defaults are in scope, prefer the one whose `where`
clause is the strict subset of the alternatives.

The trickiest variant: if your conforming type *acquires* `Equatable`
later (e.g. via a synthesized `Equatable` from compiler-generated
memberwise equality), the dispatched implementation can flip from `1` to
`2` without any change at the call site. Adding a protocol conformance
is a more invasive change than it looks.
