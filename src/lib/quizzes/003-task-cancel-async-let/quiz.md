---
title: Task Cancellation and async let
difficulty: hard
topics:
  - concurrency
answer:
  kind: prints
  output: |
    end of task
    after waiting b
    after waiting a
---

## Hint

Three things to untangle: when does the body of an `async let` actually run,
what happens when the task finishes, and does a `Task { … }` spawned inside a
regular function inherit cancellation from its caller?

## Explanation

**The code compiles even though the closure used for `b` is `async throws`, and no try is used in the `async let`
declaration.** As
per [SE-0317](https://github.com/swiftlang/swift-evolution/blob/78ee3eb4f5469b34cbd2e6a2e8dde2f6f2ac0deb/proposals/0317-async-let.md?plain=1#L125),

> For single statement expressions in the async let initializer, the await and try keywords may be omitted. The effects
> they represent carry through to the introduced constant and will have to be used when waiting on the constant. In the
> example shown above, the veggies are declared as async let veggies = chopVegetables(), and even though chopVegetables
> is
> async and throws, the await and try keywords do not have to be used on that line of code. Once waiting on the value of
> that async let constant, the compiler will enforce that the expression where the veggies appear must be covered by
> both
> await and some form of try.

**The order of "after awaiting b" and "after await a".** `async let a = { ... }()` and `async let b = { ... }()` spawns
and _does not_ await it on this line. Control
falls through to the next statement, so `print("end of task")` runs first. Once reaching the end of the task, implicit
cancel and implicit await kick in. As a result, both `a` and `b` are canceled and then awaited. Even though the
`Task.sleep` in `b` tries to sleep for `5` seconds, `b` finishes
first because `Task.sleep` respects task cancellation and throws `CancellationError` immediately. So we see
`after waiting b` before `after waiting a`. `a`, however, does not check for cancellation and hands the continuation to
the unstructured `Task` that sleeps for `1` second. So `a` finishes after `b`.

See [SE-0317](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0317-async-let.md#implicit-async-let-awaiting)
for `async let` lifecycle
and [SE-0304](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0304-structured-concurrency.md#unstructured-tasks)
for unstructured `Task` behavior.
