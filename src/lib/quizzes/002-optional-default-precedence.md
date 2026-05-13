---
title: Optional Default Precedence
difficulty: medium
topics:
  - operator precedence
options:
  - "0"
  - "1"
  - "nil"
  - compile error
correct: 1
---

## Hint

What's the precedence of `??` compared to `+`?

## Explanation

The nil-coalescing operator `??` has *lower* precedence than the arithmetic
operators, so

```swift
x ?? 0 + 1
```

parses as

```swift
x ?? (0 + 1)
```

not as `(x ?? 0) + 1`. Since `x` is `nil`, the right-hand side is evaluated,
yielding `1`. The program prints `1`.

If you wanted the other reading, you'd need explicit parentheses:

```swift
(x ?? 0) + 1   // = 1
```

In this particular case the result happens to be the same, but if `x` had
been `.some(5)` the two readings would diverge: `x ?? (0 + 1)` is `5`, while
`(x ?? 0) + 1` is `6`.
