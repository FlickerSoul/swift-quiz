---
title: discard self
difficulty: medium
topics:
  - ownership
  - noncopyable
answer:
  kind: prints
  output: saved
---

## Hint

What's `discard self` for, and how does it relate to a noncopyable type's
`deinit`?

## Explanation

A `~Copyable` type has a single owner. By default, when the unique owner
goes out of scope (or the value is consumed without being transferred
elsewhere), the type's `deinit` runs. It may surprise you if you are not familiar with noncopyable types, as regular
Swift structs don't allow `deinit`.

`discard self` is the explicit escape hatch: it tells the compiler "I'm
ending this value's lifetime _without_ running its `deinit`." It's only
usable inside a `consuming` method on a noncopyable type whose `deinit` is
defined in the same module — exactly because it's bypassing a clean-up the
author wrote.

So:

```swift
H().finalize()         // consumes the temporary H
//   ├─ "saved"        // body of finalize prints
//   └─ discard self   // suppresses deinit
```

Only `"saved"` is printed; `deinit` never runs.

The intended use case is types where the work normally done in `deinit`
has been performed manually in this code path — e.g. a transactional
"commit" that has already flushed and closed an underlying resource, so
running the destructor again would double-close. If you change
`discard self` to e.g. just `return` (or remove it), both `"saved"` and
`"deinit"` are printed.

See [SE-0390](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0390-noncopyable-structs-and-enums.md#suppressing-deinit-in-a-consuming-method).
