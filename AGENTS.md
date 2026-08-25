# AGENTS.md — lemonfiber-web

Orientation for a focused session in this repo.

> **Common rules for every lemonfiber repo** live in the spec repo, at
> [50-governance/ai-contributors.md](https://github.com/lemonfiber/spec/blob/main/50-governance/ai-contributors.md).
> This file is the web-repo-specific header; the shared rules are canonical there.

## What this repo is

The **web surface**: a static Svelte 5 app drawn from the JSON API the lemonfiber
binary serves. It talks to lemonfiber through `@lemonfiber/sdk-ts` and reaches
nothing else — no direct `fetch`, no external origin. `README.md` says what it is
and how to run it; the spec page for this repo is `30-repos/lemonfiber-web.md`.

There are two surfaces in the design: the operator's console and the household
view. Both are built from the same components in `src/components`.

## The load-bearing rules

**Everything visual comes from a token.** `src/app.css` is the only file that may
name a `--lf-*` brand token; it maps them to the names this interface uses. A
component that writes a raw colour, font-size, spacing step or radius is a defect.
`app.css` also carries the element reset — the `<button>` rule, since most controls
here are buttons and undoing the user agent's styling once beats undoing it in each
of them — and the `.said` class for text a screen reader is given where a drawing is
what a sighted reader gets. The two controls that are not buttons undo it in their
own style block: the `<input>` in `Field.svelte` and the `<a>` in `MenuItem.svelte`.
Structural geometry — a border width, an `aspect-ratio`, a `stroke-width` — is not
a token and stays literal.

**Every word a person reads comes from `messages/`.** Add a key, run
`npm run messages`, import `* as m from "../paraglide/messages.js"`. Prefer a prop:
a component is a shape and the screen supplies the words. Bare figures and proper
nouns are data and stay literal. `scripts/words.mjs` reads what those keys say and
refuses three things: an idiom, an acronym nobody declared ordinary, and a fault
named beside the person reading.

**Citations never appear in a comment.** Not a requirement ID, not an ADR number,
not a spec path. They go in the commit trailer and the pull request body.
`scripts/guards.mjs` fails the build on one.

**Accessibility is a gate, not an aspiration.** A Svelte `a11y_*` compiler
warning stops the compile rather than being printed beside it — `onwarn` in
`svelte.config.js` refuses the whole family, and `scripts/guards.mjs` refuses it
again over every component, including one nothing imports yet. `npm run a11y` serves
`storybook-static` and drives it in a browser. Every story is rendered five ways —
the light theme, the explicit dark theme, the system preference a reader who never
touched the toggle gets, a request for more contrast, and forced colours — and axe
is run over each at WCAG 2.2 AA. Three more passes run once per story: tabbing
right through it to catch a keyboard trap, reading at every place focus lands
whether it draws a ring there; reading every declared animation and transition to
catch one that repeats fast enough to flash, or that a reduced-motion preference
does not stop; and measuring the page at 320 pixels to catch sideways scroll.

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
role and accessible name and assert what a reader can observe, not that an element
exists. Stories are `Foundations/<Name>` for atoms and `Surfaces/<Name>` for
composites.

Commit with `git commit -s`, and carry a `Spec:` trailer naming an identifier that
exists in the spec repo — grep for it before citing it.

## Layout

```
src/components/   one component per file, with its test and its stories
src/lib/          the vocabulary the interface speaks — states, severities,
                  freshness, weights, icon names, places. No rendering.
src/api/          the one place a request is made, all of it through
                  @lemonfiber/sdk-ts. Where the per-run key is kept.
src/routes/       the screens, the chrome they sit in, and the panels a screen
                  is composed of. A screen is handed what it draws.
src/app.css       brand tokens mapped to this interface's names, the element
                  reset, and the one `.said` utility every component would
                  otherwise restate
messages/en.json  every word a person reads
scripts/          the gate's own tooling: structural guards, the accessibility
                  sweep, the compiler warnings the build refuses, the built
                  app's wire-version declaration
.storybook/       preview, and the helpers that put real components in a snippet
```

`src/lib` never imports from `src/components` or `src/routes` — the words must not
depend on their presentation. dependency-cruiser enforces it.

A screen never fetches. `src/routes/Console.svelte` asks and follows; every screen
and panel below it is handed what it draws, which is what lets the same screen be
drawn from a fixture in a story and swept by `npm run a11y`.

## Running several agents at once

Two actors editing one working copy has broken this repo repeatedly. Give each one
its own git worktree with its own `node_modules` (`cp -c -R` is a near-free clone
on APFS), let it run the gate there, and collect the files afterwards. Shared
files — `messages/en.json`, `src/app.css`, `.storybook/snippets.ts` — are merged by
whoever is coordinating, not by the agents.
