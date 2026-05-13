# Swift Quiz

A collection of short, tricky Swift programs that exercise corners of the
language model — exclusivity, ownership, dispatch, conditional conformance,
typed throws, dynamic member lookup, and so on. Predict what each program
does, then read the explanation.

Modeled after [Rust Quiz](https://dtolnay.github.io/rust-quiz/) by David
Tolnay. Live site: <https://swift-quiz.vercel.app>.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, runes mode) with
  `@sveltejs/adapter-static` — the whole site is prerendered to static HTML.
- [Shiki](https://shiki.style) for Swift syntax highlighting.
- [marked](https://marked.js.org) + [gray-matter](https://github.com/jonschlinkert/gray-matter)
  for the quiz Markdown.
- [Zod](https://zod.dev) for quiz frontmatter validation at build time.
- [Swiftly](https://www.swift.org/install/macos/swiftly/) for installing and
  pinning Swift toolchains used during verification.
- Bun for installs and scripts; tests use Vitest + Playwright.

## Local development

```sh
bun install
bun run dev          # http://localhost:5173
```

Other scripts:

| Script             | What it does                                                     |
| ------------------ | ---------------------------------------------------------------- |
| `bun run build`    | Static build into `build/` (runs quiz verification — see below). |
| `bun run preview`  | Serve the production build locally.                              |
| `bun run check`    | `svelte-check` over the project.                                 |
| `bun run lint`     | Prettier + ESLint.                                               |
| `bun run format`   | Prettier write.                                                  |
| `bun run test`     | Vitest unit tests (one-shot).                                    |
| `bun run test:e2e` | Playwright end-to-end tests.                                     |

## Authoring a quiz

Each quiz lives in `src/lib/quizzes/NNN-kebab-slug/`:

```
src/lib/quizzes/
  001-tuple-element-swap/
    quiz.md
    main.swift
```

- `NNN` is a zero-padded numeric id (must be unique).
- `slug` is kebab-case (lowercase letters, digits, hyphens).
- The folder must contain at least one `.swift` file. By default every
  `.swift` file in the folder is included; set `files:` in the frontmatter
  to narrow it down with globs.

### `quiz.md` format

```markdown
---
title: Tuple Element Swap
difficulty: medium # easy | medium | hard
topics:
  - tuples
  - exclusivity
  - ownership
answer:
  kind: trap # prints | compile-error | trap | non-deterministic
  # output: "..."           # required when kind is `prints`
---

## Hint

A short nudge shown behind a toggle.

## Explanation

The full explanation, shown after the user submits.
```

Two answer modes are supported:

- **Typed** (above): the user picks one of `prints` / `compile-error` /
  `trap` / `non-deterministic` (and types the expected stdout for `prints`).
- **Multiple choice**: replace `answer:` with `options:` (2–4 strings) and
  `correct:` (the zero-based index of the correct option).

Allowed topics are enumerated in [`src/lib/quiz/topics.ts`](src/lib/quiz/topics.ts);
the build fails if a quiz uses one that isn't listed.

### Build-time verification

`bun run build` validates that each quiz's source actually produces its
declared answer. For every (quiz × configured Swift version) pair, the
build compiles the Swift file with `swiftc` (via `swiftly`), runs the
binary, and compares the result against the frontmatter. Mismatches abort
the build with a diff and a path back to the quiz file.

The configured toolchains live in [`src/lib/quiz/config.ts`](src/lib/quiz/config.ts)
(`SWIFT_VERSIONS`). Specs may be `major.minor` (resolved to the latest patch)
or exact `major.minor.patch`. Results are cached on disk in
`.swift-quiz-cache.json` keyed by source + expected answer + version.

Verification is skipped for: multi-file quizzes, non-deterministic answers,
and multiple-choice quizzes.

Environment flags:

| Variable                    | Effect                                                 |
| --------------------------- | ------------------------------------------------------ |
| `SWIFT_QUIZ_SKIP_VERIFY=1`  | Skip verification entirely.                            |
| `SWIFT_QUIZ_FORCE_VERIFY=1` | Recompile every quiz, ignoring the cache (used by CI). |

In `NODE_ENV=production` the default is `compile`; otherwise the default is
`cache-only` (use cached results when present, skip otherwise) so local
`dev` and `build` don't need a Swift toolchain installed.

## Project layout

```
src/
  lib/
    components/        # Svelte UI components
    quiz/              # client-safe quiz model: types, grading, topics, config
    server/quiz/       # build-time loader, parser, renderer, verifier
    quizzes/           # the quizzes themselves (Markdown + Swift)
    storage/           # localStorage-backed attempt history
  routes/              # SvelteKit routes (/, /quiz/[id], /history, /about)
```

Progress (which quizzes you've attempted or solved) is kept in the browser's
`localStorage` only — nothing is sent to a server.

## Deployment

CI builds with `SWIFT_QUIZ_FORCE_VERIFY=1` so every quiz is re-verified
against a freshly installed toolchain, then deploys the static output to
Vercel. See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## Contributing

PRs adding quizzes or fixing explanations are welcome. Please keep each
quiz small, surprising, and grounded in observable language behavior — the
build will refuse a quiz whose declared answer doesn't match what `swiftc`
actually does.
