---
title: Existential Self Requirement
difficulty: easy
topics:
  - existentials
  - protocols
answer:
  kind: compile-error
---

## Hint

What does `Self` mean inside the extension, and what would it have to mean
for `a == b` to be type-checked?

## Explanation

The `Equatable` protocol is defined as following:

```swift
public protocol Equatable {
    static func == (lhs: Self, rhs: Self) -> Bool
}
```

When you upcast `1` to `any Equatable`, the compiler erases the underlying
type. Now `a` and `b` are both `any Equatable`, but the compiler has no
proof that they wrap the same `Self`. Calling `a == b` would
require `b` to be `a`'s `Self` — and there's nothing to check that
against. The diagnostic spells this out:

```
- error: binary operator '==' cannot be applied to two 'any Equatable' operands
```
