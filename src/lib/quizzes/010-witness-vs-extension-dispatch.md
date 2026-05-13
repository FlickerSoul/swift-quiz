---
title: Witness vs Extension Dispatch
difficulty: hard
topics:
  - protocols
  - dispatch
answer:
  kind: prints
  output: |
    2
    2
    2
    1
---

## Hint

One of `P` and `Q` declares its method as a requirement. The other only
adds the method in an extension. Why does that change which `S`
implementation runs?

## Explanation

The rule:

- A method **declared in the protocol body** is a _requirement_. The
  conforming type must supply a witness, and calls — whether the static
  type is the concrete type or the existential — dispatch dynamically
  through the witness table.
- A method **only declared in a protocol extension** is _not_ a
  requirement. It's a free-floating default that lives outside the
  witness table. Calls dispatch statically on the type the compiler sees
  at the call site.

Apply that to each line:

| call    | static type | requirement? | witness?                                                | result |
| ------- | ----------- | ------------ | ------------------------------------------------------- | ------ |
| `s.f()` | `S`         | yes (`P.f`)  | `S.f` → "2"                                             | `2`    |
| `p.f()` | `P`         | yes          | `S.f` → "2"                                             | `2`    |
| `s.g()` | `S`         | no           | n/a — static dispatch picks `S.g` → "2"                 | `2`    |
| `q.g()` | `Q`         | no           | n/a — static dispatch picks the _extension_ `Q.g` → "1" | `1`    |

The fourth line is the trap. Even though `q`'s underlying value is `S`
(which has its own `g()`), `g` is _not_ a protocol requirement, so the
compiler doesn't go through a witness table. It binds the call to the
extension method visible on the static type `Q`, which prints `"1"`.

If you want `S`'s `g()` to win when invoked through `q: Q`, add
`func g()` to the body of `Q`. That promotes `g` to a requirement, gives
`S` a witness slot for it, and makes `q.g()` dispatch dynamically to
`S.g()`.
