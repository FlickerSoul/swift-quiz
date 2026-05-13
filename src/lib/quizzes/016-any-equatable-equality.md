---
title: Equating Two any Equatable Values
difficulty: medium
topics:
  - existentials
  - protocols
answer:
  kind: compile-error
---

## Hint

What's the signature of `Equatable.==`, and why doesn't `any Equatable`
satisfy it?

## Explanation

`Equatable` is defined roughly as:

```swift
protocol Equatable {
  static func == (lhs: Self, rhs: Self) -> Bool
}
```

`Self` here is a **same-type** requirement: both operands must be the same
concrete type. When you upcast a value to `any Equatable`, the static type
is the existential — and the existential doesn't have a `Self` to bind.
The compiler can't prove that `a`'s underlying `Self` is the same as
`b`'s, so `==` can't be called:

```
error: binary operator '==' cannot be applied to two 'any Equatable' operands
```

This is a closely related failure mode to the `Self`-in-parameter case
from the previous quiz on `same(as:)`. Any protocol member whose
signature mentions `Self` as a non-covariant position prevents you from
calling it through the existential.

Workarounds, from cheapest to most invasive:

1. **Cast back to the underlying type.** If you know they're both `Int`:

   ```swift
   (a as? Int) == (b as? Int)   // true / false / both nil
   ```

2. **Go generic.** Replace `any Equatable` with a generic parameter:

   ```swift
   func eq<E: Equatable>(_ a: E, _ b: E) -> Bool { a == b }
   ```

3. **Type-erase deliberately** with a wrapper like `AnyHashable`, which
   stores the concrete type alongside the value and implements `==` /
   `hash(into:)` itself:

   ```swift
   let a: AnyHashable = 1
   let b: AnyHashable = 1
   a == b   // true
   ```

`AnyHashable` is the standard library's answer when you need a heterogeneous
collection of equatable things. Plain `any Equatable` is mostly useful as
a parameter type that you'll downcast immediately.
