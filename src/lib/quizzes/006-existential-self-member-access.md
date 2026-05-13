---
title: Existential Self Requirement
difficulty: medium
topics:
  - existentials
  - protocols
answer:
  kind: compile-error
---

## Hint

What does `Self` mean inside the extension, and what would it have to mean
for `a.same(as: b)` to be type-checked?

## Explanation

The extension is on `Equatable`, so `same(as:)` has the signature
`(Self) -> (Self) -> Bool` — it takes another value of the *same concrete
type* as the receiver.

When you upcast `1` to `any Equatable`, the compiler erases the underlying
type. Now `a` and `b` are both `any Equatable`, but the compiler has no
proof that they wrap the same `Self`. Calling `a.same(as: b)` would
require `b` to be `a`'s `Self` — and there's nothing to check that
against. The diagnostic spells this out:

```
error: member 'same' cannot be used on value of type 'any Equatable';
       consider using a generic constraint instead
```

In Swift 5.7+ you can sometimes still call methods on an existential —
the rules were relaxed for protocol members whose signatures don't
reference `Self` (or only do so covariantly). `same(as:)` uses `Self` in
*input* position, which is the case that still doesn't fly: the compiler
would need to dispatch to a specific witness, and the witness for `Int`
expects an `Int`, not "whatever happens to be inside the other box."

The standard fix is to take the values out of the existential by going
generic:

```swift
func compare<E: Equatable>(_ a: E, _ b: E) -> Bool { a.same(as: b) }
```

Then `Self` is bound to a concrete type, and both arguments are required
to match it.
