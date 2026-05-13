---
title: Optional-Chained Mutation on a Dictionary
difficulty: medium
topics:
  - optionals
  - dictionaries
answer:
  kind: prints
  output: '4'
---

## Hint

`d["a"]` returns a _copy_ of the array, doesn't it? How can
`d["a"]?.append(4)` possibly mutate the array stored under `"a"`?

## Explanation

The intuition "subscripts return a copy" is right for _reading_, but
Dictionary's subscript also has a **setter**, and the compiler uses it
when a mutating method like `append(_:)` is applied through an optional
chain.

The expression `d["a"]?.append(4)` desugars roughly to:

```swift
if var value = d["a"] {
    value.append(4)
    d["a"] = value
}
```

Crucially, the optional-chain syntax preserves access to the _storage_
that produced the optional. When `?.` chains into a mutating method on a
value-type element, the compiler arranges for the mutation to flow back
through the original subscript — first reading the value, mutating its
local copy, then writing it back via the dictionary's setter. The net
effect is exactly what you wanted: the array under `"a"` becomes
`[1, 2, 3, 4]`.

Things that would _not_ work:

- `let d = ["a": [1, 2, 3]]; d["a"]?.append(4)` — the dictionary is
  immutable, so the setter isn't available. `append` is mutating, so this
  fails to compile.
- `d["a", default: []].append(4)` is the idiomatic form when you want the
  same effect but don't care whether the key was present; the
  `default:`-overload subscript also has a mutating setter and avoids the
  nil branch.
