---
title: Nested Closure Weak Self
difficulty: hard
topics:
  - concurrency
  - ownership
answer:
  kind: prints
  output: |
    2
    3
    3
---

## Hint

We have `[weak self]` in one place.

## Explanation

`_getRetainCount` reports the strong reference count at the moment of the
call. The "+1" trick is the argument itself: passing `obj` to a non-borrowing
parameter retains it, so a freshly-created object with one local binding
reads as `2`, not `1`. That accounts for the first line.

The interesting line is the second one. After `obj.work()` the count is
`3`, even though the only capture list in `work()` says `[weak self]`.
The body of `work()` is

```swift
task = Task.detached {
    try await longRunningTask { [weak self] in
        self?.run()
    }
}
```

Only the **inner** closure has `[weak self]`. The outer `Task.detached`
closure has no capture list, so it implicitly captures whatever it uses
from the enclosing scope by **strong** reference. And it _does_ use
something from that scope: evaluating the inner closure's `[weak self]`
capture list reads `self` to install it as a weak reference. To make that
read possible, the outer closure must hold `self` itself — strongly,
because it didn't say otherwise. Therefore, the second digit is `3`.

If the snippet were written like the following, the second number would be `2` instead of `3`:

```swift
task = Task.detached { [weak self] in
    try await longRunningTask { [weak self] in
        self?.run()
    }
}
```

The third `3` comes from the body of the detached task firing one second
later. The `do` block has ended, so the local `obj` binding is gone — but
the strong reference held by the outer closure keeps the object alive.
When `body()` runs, `self?.run()` unwraps the weak reference successfully
and prints `_getRetainCount(self)` again. The strong references at that
moment are: the outer closure's capture, the implicit `self` parameter of
`run()`, and the `_getRetainCount` argument — three, same as before.

If the outer capture had been `[weak self]`, `obj` would have been
deallocated at the end of the `do` block and nothing would have printed, resulting in only two numbers of `2`.
