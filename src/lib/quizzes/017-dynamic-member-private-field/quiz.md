---
title: '@dynamicMemberLookup Over a Private Field'
difficulty: easy
topics:
  - dynamic-member-lookup
answer:
  kind: prints
  output: '99'
---

## Hint

`y` exists on `Wrap`. From outside the type, can the compiler see it?
If it can't, what's the next thing it tries?

## Explanation

Access control happens _before_ member lookup. From outside the file/module
that defines `Wrap`, the private `y` is invisible — for the purposes of
name resolution, it might as well not exist. So the compiler can't bind
`Wrap().y` to the stored property.

But `Wrap` is marked `@dynamicMemberLookup`, which means "if you can't
find a member named `key` by ordinary lookup, try the
`subscript(dynamicMember: String)` overload." The lookup falls through,
the subscript is called with `"y"`, and it unconditionally returns `99`.
