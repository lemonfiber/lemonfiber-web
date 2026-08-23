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
`app.css` also carries the element reset — every control here is a `<button>`, and
undoing the user agent's styling once beats undoing it in each of them — and the
`.said` class for text a screen reader is given where a drawing is what a sighted
reader gets.
Structural geometry — a border width, an `aspect-ratio`, a `stroke-width` — is not
a token and stays literal.

**Every word a person reads comes from `messages/`.** Add a key, run
`npm run messages`, import `* as m from "../paraglide/messages.js"`. Prefer a prop:
a component is a shape and the screen supplies the words. Bare figures and proper
nouns are data and stay literal.

**Citations never appear in a comment.** Not a requirement ID, not an ADR number,
not a spec path. They go in the commit trailer and the pull request body.
`scripts/guards.mjs` fails the build on one.

**Accessibility is a gate, not an aspiration.** `npm run a11y` runs axe over every
story in three palettes — the light theme, the explicit dark theme, and the system
preference, which is the one a reader who never touched a toggle actually gets.

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
(`--fail-on-warnings`) · `scripts/guards.mjs` · dependency-cruiser · vitest at
**100% statements, branches, functions and lines** · app build · Storybook build ·
the axe sweep. All of it, green.

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
                  freshness, weights, icon names. No rendering.
src/app.css       brand tokens mapped to this interface's names, the element
                  reset, and the one `.said` utility every component would
                  otherwise restate
messages/en.json  every word a person reads
scripts/          the gate's own tooling: structural guards, the axe sweep
.storybook/       preview, and the helpers that put real components in a snippet
```

`src/lib` never imports from `src/components` — the words must not depend on their
presentation. dependency-cruiser enforces it.

## Running several agents at once

Two actors editing one working copy has broken this repo repeatedly. Give each one
its own git worktree with its own `node_modules` (`cp -c -R` is a near-free clone
on APFS), let it run the gate there, and collect the files afterwards. Shared
files — `messages/en.json`, `src/app.css`, `.storybook/snippets.ts` — are merged by
whoever is coordinating, not by the agents.
