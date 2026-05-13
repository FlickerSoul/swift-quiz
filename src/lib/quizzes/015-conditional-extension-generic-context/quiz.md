---
title: Constrained Extension and Generic Context
difficulty: hard
topics:
  - conditional-conformance
  - generics
  - dispatch
answer:
  kind: prints
  output: |
    int
    any
    any
---

## Hint

Look at the third call carefully. The runtime type of `b` inside
`describe` _is_ `Box<Int>`. So why doesn't the constrained extension
apply?

## Explanation

There are two overlapping `tag()` methods on `Box`:

- `extension Box where T == Int` — applies only when `T` is concretely
  `Int`.
- `extension Box` — applies for any `T`.

For the first two calls the compiler knows the concrete `T` at the call
site, so it picks the most-specific applicable extension:

```
Box<Int>().tag()      → constrained extension wins   → "int"
Box<String>().tag()   → only the unconstrained one   → "any"
```

The third call is where Swift's static-dispatch model bites:

```swift
func describe<T>(_ b: Box<T>) { print(b.tag()) }
describe(Box<Int>())
```

Inside `describe`, the compiler types `b` as `Box<T>` with `T` an
_opaque_ type parameter constrained only by what `describe` declared
(here, nothing). The `where T == Int` extension is **not visible to
generic code that hasn't constrained `T`** — the compiler can't prove the
constraint at the call site inside the function body, so it can't bind
the call to that extension.

Generic functions in Swift bind their member calls _once_, at the
function's declaration site, based on what the function's generic
parameters guarantee. The actual `T = Int` at the use site doesn't
re-trigger overload resolution. So `b.tag()` resolves to the
unconstrained extension and prints `"any"` — even though, at runtime,
`b` really is a `Box<Int>`.

The fix: hoist the constraint onto the generic function:

```swift
func describeInt(_ b: Box<Int>) {
    print(b.tag())
}
// or, conditional:
func describe<T>(_ b: Box<T>) where T == Int { ... }
```

Either way, the compiler can now see the `T == Int` constraint when
type-checking `b.tag()` and picks the constrained extension.

Also, it would be easier to see if the function is written as

```swift
func describe(_ b: Box<some Any>) {
  ...
}
```
