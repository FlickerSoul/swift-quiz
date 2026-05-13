---
title: Tuple Element Swap
difficulty: medium
topics:
  - tuples
  - exclusivity
  - ownership
answer:
  kind: trap
---

## Hint

What does Swift's law of exclusivity say about two `inout` arguments derived
from the same root variable?

## Explanation

The compiler is happy with this code — `t.0` and `t.1` are statically known
to be distinct fields, so on its face `swap(&t.0, &t.1)` looks like it
should be fine. But `swap(_:_:)` requires its two `inout` arguments to refer
to **disjoint** storage, and the _dynamic_ exclusivity check sees that both
accesses share the same root variable `t` and traps:

```
Simultaneous accesses to <addr>, but modification requires exclusive access.
…
Fatal access conflict detected.
```

To exchange two elements of the same tuple, assign through a tuple literal
(which evaluates the right-hand side first and then writes once):

```swift
(t.0, t.1) = (t.1, t.0)
```

This is one of the rarer cases where the static exclusivity check passes
but the dynamic one still fires.
