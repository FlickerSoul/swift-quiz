---
title: Tuple Element Swap
difficulty: easy
topics: [macro]
answer:
  kind: prints
  output: "(2, 1)"
---

## Hint

`swap(_:_:)` takes two `inout` parameters.

## Explanation

Swift exposes tuple elements as addressable storage, so `&t.0` and `&t.1`
each give the standard-library `swap` function valid `inout` references into
the same tuple. After the call, the elements have exchanged values and the
tuple prints as `(2, 1)`.

The interesting bit is that this works at all: `swap` requires its two
arguments to refer to *distinct* storage, and the compiler enforces that by
checking the access paths. `t.0` and `t.1` are statically known to be
different fields, so the law-of-exclusivity check passes. If you tried
`swap(&t.0, &t.0)`, the compiler would reject it.
