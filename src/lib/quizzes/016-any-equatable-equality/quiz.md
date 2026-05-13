---
title: Conditional Consume
difficulty: medium
topics:
  - noncopyable
  - ownership
answer:
  kind: compile-error
---

## Hint

What's the lifecycle of `file`?

## Explanation

As per SE-0390,

> Consuming is flow-sensitive, so if one branch of an if or other control flow consumes a noncopyable value, then other
> branches where the value is not consumed may continue using it:
>
> ```swift
> let x = FileDescriptor()
> guard let condition = getCondition() else {
> consume(x)
> return
> }
> // We can continue using x here, since only the exit branch of the guard
> // consumed it
> use(x)
> ```

In this case, the `if` statement is not exhaustive, so the compiler can't guarantee that `file` is always exists after
the `if` statement. The diagnostic spells this out:

```
- error: 'file' used after consume
```
