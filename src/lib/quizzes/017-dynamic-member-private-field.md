---
title: "@dynamicMemberLookup Over a Private Field"
difficulty: medium
topics:
  - dynamic-member-lookup
answer:
  kind: prints
  output: "99"
---

## Hint

`y` exists on `Wrap`. From outside the type, can the compiler see it?
If it can't, what's the next thing it tries?

## Explanation

Access control happens *before* member lookup. From outside the file/module
that defines `Wrap`, the private `y` is invisible — for the purposes of
name resolution, it might as well not exist. So the compiler can't bind
`Wrap().y` to the stored property.

But `Wrap` is marked `@dynamicMemberLookup`, which means "if you can't
find a member named `key` by ordinary lookup, try the
`subscript(dynamicMember: String)` overload." The lookup falls through,
the subscript is called with `"y"`, and it unconditionally returns `99`.

The output is `99`.

What this means in practice:

- `@dynamicMemberLookup` is *not* a back door around access control. The
  outside caller never reads the private `y`; they read whatever the
  subscript returns.
- But it *is* a name-collision hazard. Adding a `private var someName`
  to a `@dynamicMemberLookup` type doesn't reserve the name for outside
  callers — they can still write `value.someName` and get the dynamic
  fallback, which may not be what either side expects.

The same fallback fires for *any* name the outside caller can't see:
typos, members added in a later version, members that exist on a
different platform's stdlib, and so on. If silent-fallback is bad in
your domain, return `Int?` from the subscript and check for `nil` at the
call site — or don't adopt `@dynamicMemberLookup` at all.
