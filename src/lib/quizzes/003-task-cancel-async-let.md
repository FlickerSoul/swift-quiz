---
title: Task Cancellation and async let
difficulty: hard
topics:
  - concurrency
answer:
  kind: prints
  output: |
    after let
    resumed
    finished
---

## Hint

Three things to untangle: when does the body of an `async let` actually run,
which task does `cancel()` cancel, and does a `Task { … }` spawned inside a
regular function inherit cancellation from its caller?

## Explanation

There are two surprises here.

**The order of "after let" and "resumed".** `async let a = { … }()` spawns
the closure on a child task and _does not_ await it on this line. Control
falls through to the next statement, so `print("after let")` runs first.
The implicit `await` on `a` only fires at the end of the enclosing scope —
that's where the outer task suspends until the closure returns.

**Why "resumed" gets printed at all, even though we cancelled.**
`task.cancel()` propagates cancellation to the outer `Task` and to its
structured children (including the `async let` child). But:

1. Cancellation is _cooperative_: nothing inside the `async let` body
   actually checks `Task.isCancelled` or calls a cancellation-throwing
   primitive on the cancelled-task path.
2. The `try await Task.sleep` lives inside an **unstructured**
   `Task { … }` spawned from `resumeLater`. Unstructured tasks do **not**
   inherit cancellation from their enclosing task, so this sleep is not
   cancelled. It runs to completion, resumes the continuation with `1`,
   and the closure returns normally.

So the outer task ends up printing both `"after let"` and `"resumed"`,
`await task.result` succeeds, and `"finished"` prints last.

If you wanted the cancel to actually interrupt the wait, you'd use
`withTaskCancellationHandler` (or `withCheckedThrowingContinuation` with a
cancellation handler) so cancelling the outer task resumes the
continuation with an error.
