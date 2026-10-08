# AGENTS.md — lemonfiber-web

> **Start at the roadmap and board on [lemonfiber.app](https://lemonfiber.app),
> rendered from the report of where every unreleased version stands. Then the
> rules** every repository shares:
> [working in the repositories](https://github.com/lemonfiber/spec/blob/main/50-governance/working-in-the-repositories.md)
> and [the rules for agents](https://github.com/lemonfiber/spec/blob/main/50-governance/ai-contributors.md).
> This file holds only what is true of this repository.

## What this repo is

The **web surface**: a static Svelte 5 app drawn from the JSON API the lemonfiber
binary serves. It talks to lemonfiber through `@lemonfiber/sdk-ts` and reaches
nothing else — no direct `fetch`, no external origin. `README.md` says what it is
and how to run it; the spec page for this repo is `30-repos/lemonfiber-web.md`.

There are two surfaces: the operator's console and the household view. Which one
a page draws follows from who signed in — lemonfiber's answer at the door names a
household member or nobody — and never from the address or a setting. Both are
built from the same components in `src/components`.

**What the console offers is measured, not remembered.** `src/offered.test.ts`
classifies every kind the client carries and every request another surface can
make as offered here, offered elsewhere by a named requirement, or not offered
yet with its feature, and `docs/surface-parity.md` states what those lists come
to. A screen that reads a new kind or offers a new request moves it to offered
in both, in the same change; the suite fails until they agree.

## The load-bearing rules

**Everything visual comes from a token.** `src/app.css` is the only file that may
name a `--lf-*` brand token; it maps them to the names this interface uses. A
component that writes a raw colour, font-size, spacing step or radius is a defect.
`app.css` also carries the `<button>` reset and the `.said` class for text a screen
reader is given in place of a drawing. Structural geometry — a border width, an
`aspect-ratio`, a `stroke-width` — is not a token and stays literal.

**Every word a person reads comes from `messages/`.** Add a key to the file in
`messages/en/` that holds the other keys with its prefix, run `npm run messages`,
import `* as m from "../paraglide/messages.js"`. A new area gets a new file, named
in `project.inlang/settings.json`. Prefer a prop: a component is a shape and the
screen supplies the words. Bare figures and proper nouns are data and stay literal.
`scripts/words.mjs` reads what those keys say and refuses four things: an idiom,
an acronym nobody declared ordinary, a fault named beside the person reading, and
an explanation of a word. It also refuses a key kept in two files, a prefix split
across files, and a file the settings do not name.

**This ecosystem's own words are not among them.** _Indexer, hardlink, retention,
ratio_ live in one table compiled into the binary and served at `/api/explain`.
`Term.svelte` asks for one when a reader presses it; `scripts/words.mjs` refuses a
message here that explains one of them again.

**Accessibility is a gate, not an aspiration.** A Svelte `a11y_*` compiler
warning stops the compile (`onwarn` in `svelte.config.js`, and again in
`scripts/guards.mjs`). `npm run a11y` renders every story in five themes and
contrast modes and runs axe over each at WCAG 2.2 AA, then checks each story for
keyboard traps, missing focus rings, flashing or unstoppable motion, and sideways
scroll at 320 pixels.

## Two Svelte traps the coverage gate will not forgive

Svelte emits `?? ''` fallbacks that no test can reach, and the gate is 100% on
branches. Both shapes are invisible in the source, so `scripts/guards.mjs` reads
the compiled output instead and names the file.

```svelte
<!-- interpolation inside an attribute string -->
<span class="tag {tone}">          <!-- wrong -->
<span class:watch={tone === "watch"}>   <!-- right -->

<!-- an interpolation with a sibling in the same parent -->
<span><Mark /> {text}</span>                        <!-- wrong -->
<span><Mark /><span class="word">{text}</span></span>  <!-- right -->
```

Give the interpolation its own element and `display: contents` so nothing moves.

## Before you commit

```
npm run ci
```

paraglide compile · prettier · eslint (0 warnings) · svelte-check
(`--fail-on-warnings`) · `scripts/guards.mjs` · `scripts/words.mjs` ·
dependency-cruiser · vitest at **100% statements, branches, functions and lines** ·
app build · Storybook build · the accessibility sweep. All of it, green.

Every component gets a `.test.ts` and a `.stories.ts` beside it. Tests query by
role and accessible name and assert what a reader can observe. Stories are
`Foundations/<Name>` for atoms and `Surfaces/<Name>` for composites. A large screen
is tested in one file per concern (`Dashboard.test.ts`, `DashboardDoor.test.ts`),
sharing helpers through a `.testing.ts` module that only suites, stories and other
`.testing.ts` files may import.

## Layout

```
src/components/   one component per file, with its test and its stories
src/lib/          the interface's vocabulary: states, severities, icons. No rendering
src/api/          the one place a request is made, through @lemonfiber/sdk-ts
src/routes/       the screens, their chrome and panels; a screen is handed what it draws
src/app.css       brand tokens mapped to this interface's names, the reset, `.said`
messages/en/      every word a person reads, one file per area
docs/             what the console offers, and what it does not yet
scripts/          the gate's tooling: guards, words, the accessibility sweep
.storybook/       preview, and the helpers that put real components in a snippet
```

`src/lib` never imports from `src/components` or `src/routes` — the words must not
depend on their presentation. dependency-cruiser enforces it.

A screen never fetches. `src/routes/Console.svelte` and `src/routes/Member.svelte`
ask and follow; every screen and panel below them is handed what it draws, which is
what lets the same screen be drawn from a fixture in a story and swept by
`npm run a11y`.

Shared files — `messages/en/*.json`, `src/app.css`, `.storybook/snippets.ts` — are
merged by whoever is coordinating parallel work, not by each agent. A worktree's
own `node_modules` is a near-free `cp -c -R` on APFS.
