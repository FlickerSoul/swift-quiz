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

What's `_modify`?

## Explanation

The subscript operator in Dictionary not only have a getter `get` and a setter `set`, but also a `_modify` accessor.
Unlike its counterpart which returns a copy or receives a copy of `[Int]` in this case, the `_modify` accessor returns a
mutable reference via the `yield` keyword, so that the caller can directly mutate the value in place without copying it.

See [Dictionary source code](https://github.com/swiftlang/swift/blob/5db4b012337880084e058aa9a899a9ad475f7291/stdlib/public/core/Dictionary.swift#L839-L855),
and [SE-0474](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0474-yielding-accessors.md),
and [SE-0507](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0507-borrow-accessors.md).
