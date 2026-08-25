<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/logo-on-ink.svg">
    <img alt="lemonfiber" src=".github/logo.svg" height="72">
  </picture>
</p>

<h1 align="center">Lemonfiber &mdash; lemonfiber-web</h1>

<p align="center">
  The web surface: an operator console and a household view, drawn from the JSON
  API the <code>lemonfiber</code> binary serves. A static application with no
  server of its own.
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-in%20progress%20%C2%B7%20M7-F0C419?labelColor=17160F">
  <img alt="Licence" src="https://img.shields.io/badge/licence-Hippocratic%203.0-17160F">
</p>

---

> **Status: early.** The component library is built, and the operator's console
> is being assembled from it. This repo is milestone **M7** on the
> [roadmap](https://github.com/lemonfiber/spec/blob/main/00-overview/roadmap.md).
> Full account in the spec:
> [`30-repos/lemonfiber-web.md`](https://github.com/lemonfiber/spec/blob/main/30-repos/lemonfiber-web.md).

## What it is

A **static application with no server of its own**. It is built to a directory of
files, and on a version tag [`publish.yml`](.github/workflows/publish.yml) pushes
that build output to a `built-<tag>` tag — the form the `lemonfiber` binary takes
it in, as a pinned submodule it embeds. No version tag has been cut here yet, and
`lemonfiber` declares no submodule for it, so no binary carries the app today.

`lemonfiber`'s
[web API](https://github.com/lemonfiber/spec/blob/main/20-architecture/contracts/web-api.md)
is the only place this application may get data from, and it reaches nothing else.
The operator's console asks it for what it draws, asks it to act on the forms
the stack declares, and redeems the name work outliving a request comes back
with; the household view is not built yet.

That constraint is the point rather than a limitation. `G1-R2` says no surface may
implement behaviour independently, and an application whose only capability is to
ask the core and draw the answer **cannot** violate it.

## The two surfaces

The application serves two audiences, and they are **not** the same interface with
things hidden:

- **The console** — an operator's view. State, checks, logs, services, setup,
  household administration.
- **The household view** — what everyone else gets. Asking for something, seeing
  whether it is ready, and nothing else.

Both are built from one component library and one set of tokens, so they cannot
drift apart visually. What differs is which of them a given person is served.

## Running it

```console
npm ci
npm run dev
```

That serves the application on Vite's dev server, which has no back end of its own
and no proxy to one. The page asks lemonfiber at its own address, which is the
address the binary serves it from — so the dev server draws the shell and the
empty states, and a console with figures in it means running a build the binary
carries.

Requires Node **26 or newer**, as declared in `engines`.

`npm ci` is also what turns on this repository's pre-push hook, which refuses a
push that would leave a branch carrying no commit `origin/main` does not — what
pushing the trunk over a feature branch looks like. npm's `prepare` script does
it, so `npm install` serves too. A clone nobody has installed into has no hook:
it is `git config core.hooksPath .githooks`, per clone, and git cannot read
`.githooks/` on its own.

## The gate

Everything CI runs, in one command:

```console
npm run ci
```

The individual steps are the `scripts` in [`package.json`](package.json), and each
runs on its own while you work — `npm test` for the fast loop, `npm run storybook`
to build a component in isolation, and `npm run a11y` to sweep every built story in
a browser (after `npm run storybook:build`).

The Rust workspace's standards apply here from the first commit, in their web
equivalents: 100% coverage across lines, statements, branches and functions;
`strict` TypeScript with `any` and non-null assertions banned; zero lint warnings
tolerated; architecture and file-size guards; accessibility asserted in the
component tests and swept over every built story in a browser. The
[spec page](https://github.com/lemonfiber/spec/blob/main/30-repos/lemonfiber-web.md)
maps each one to the workspace rule it mirrors.

## What this repo must not do

These are the load-bearing rules, and each has a spec requirement behind it:

| Rule                                   | Why                                                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Reach anything but `lemonfiber`**    | No CDN, no font host, no analytics, no telemetry. Assets are embedded at build time, which is also what makes the interface identical on Linux, Windows and macOS  |
| **Talk to the API directly**           | Transport, the event stream and version negotiation belong to [`@lemonfiber/sdk-ts`](https://github.com/lemonfiber/sdk-ts); this repo renders what the SDK returns |
| **Implement behaviour**                | If the answer is not in an envelope, the surface does not know it (`G1-R2`)                                                                                        |
| **Invent an action**                   | Everything it can do, the CLI can do (`ARCH-R48`)                                                                                                                  |
| **Hardcode a colour, size or spacing** | Those belong to [`@lemonfiber/brand`](https://github.com/lemonfiber/brand) and are consumed as data                                                                |

## What it consumes

| From                                                         | What                                                                                           |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [`@lemonfiber/sdk-ts`](https://github.com/lemonfiber/sdk-ts) | State, actions and the event stream, over the web API; and the wire version the build declares |
| [`@lemonfiber/brand`](https://github.com/lemonfiber/brand)   | Colour, type, spacing, radii, the logo — at build time                                         |

Both are pinned in [`package.json`](package.json); that file is the version of
record, so nothing here restates it.

## Contributing

The spec is **canonical**: every change cites a spec identifier that already
exists. Routine maintenance cites `GOV-R12`.

- [Contributing guide](https://github.com/lemonfiber/.github/blob/main/CONTRIBUTING.md)
  · [Support](https://github.com/lemonfiber/.github/blob/main/SUPPORT.md)
  · [Security](https://github.com/lemonfiber/.github/blob/main/SECURITY.md)
  · [Code of conduct](https://github.com/lemonfiber/.github/blob/main/CODE_OF_CONDUCT.md)
- [ADR-0011](https://github.com/lemonfiber/spec/blob/main/00-overview/decisions/0011-web-surface-as-a-fifth-repo.md)
  — why the web surface is its own repo
- [ADR-0012](https://github.com/lemonfiber/spec/blob/main/00-overview/decisions/0012-web-assets-embedded-at-build-time.md)
  — how it ships
- [ADR-0013](https://github.com/lemonfiber/spec/blob/main/00-overview/decisions/0013-an-sdk-owns-the-api-client.md)
  — why it goes through an SDK rather than `fetch`
- [G1 interface tiers](https://github.com/lemonfiber/spec/blob/main/10-functional/features/g-ux/g1-interface-tiers.md)
  · [G3 accessibility](https://github.com/lemonfiber/spec/blob/main/10-functional/features/g-ux/g3-accessibility.md)

## Licence

[Hippocratic License 3.0](LICENSE) — ethical-source, source-available,
deliberately not OSI-approved. See the
[rationale](https://github.com/lemonfiber/spec/blob/main/90-appendix/license-rationale.md).

---

<p align="center">
  <a href="https://nightworks.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset=".github/nightworks-white.png">
      <img alt="NightWorks.io" src=".github/nightworks-dark.png" height="20">
    </picture>
  </a>
  &nbsp;&middot;&nbsp;<a href="https://discord.nightworks.io"><img alt="Discord" src=".github/discord.svg" height="20"></a>
</p>
