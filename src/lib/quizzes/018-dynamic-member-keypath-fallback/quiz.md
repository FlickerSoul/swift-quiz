---
title: Dynamic Member Lookup Priority
difficulty: hard
topics:
  - dynamic-member-lookup
  - generics
answer:
  kind: prints
  output: |
    1
    0
    z
---

## Hint

Three layers compete: a real stored property on `Wrap` (`y`), a key-path
subscript over `Inner`, and a string subscript. What's the precedence?

## Explanation

`@dynamicMemberLookup` member resolution runs in this order:

1. **Ordinary member lookup.** If `Wrap` has a real (visible) member with
   the requested name, it wins outright — `@dynamicMemberLookup` is a
   _fallback_, not a hijack.
2. **Subscript candidates whose `dynamicMember` parameter type matches.**
   For a key-path-based subscript, the candidate is applicable only if a
   `KeyPath<T, U>` for the requested name exists on `T`. The most
   specific applicable candidate wins.
3. **String-based subscript** (`dynamicMember: String`) as a final
   catch-all.

Apply that to each line:

```
w.x   → no real member named x on Wrap
       → KeyPath<Inner, Int> for \.x exists, so KP subscript fires
       → inner[keyPath: \.x] = 1
w.y   → Wrap *has* a stored y (the var y = 0)
       → no fallback fires; reads the stored property
       → 0
w.z   → no real member named z on Wrap
       → no KeyPath<Inner, _> for "z" exists
       → falls through to the String subscript
       → "z"
```

Two things people miss:

- Adding `var y = 0` to `Wrap` is what stole `w.y` from the inner. If you
  _want_ the wrapped value's property to win for shared names, you have
  to either rename `Wrap`'s field or not store it as a normal member.
- Whether a key-path subscript is applicable to `\.<name>` is decided
  _statically_, by what `Inner` exposes at the call site. There's no
  runtime "look up `z` and discover it doesn't exist" — the compiler
  rejects the key-path overload outright and the string overload is the
  only remaining match.

This priority is exactly what makes the SwiftUI-style dynamic-property
patterns (`@Binding`, `Published`, etc.) feel transparent: the wrapper
exposes its own essential surface area as real properties, then forwards
everything else through key-path lookup.
