<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/logo-on-ink.svg">
    <img alt="lemonfiber" src=".github/logo.svg" height="72">
  </picture>
</p>

<h1 align="center">Lemonfiber &mdash; lemonfiber-web</h1>

<p align="center">
  lemonfiber's web interface: a console for the person who runs the stack, and
  a view for everyone else in the household.
</p>

<p align="center">
  <img alt="Licence" src="https://img.shields.io/badge/licence-Hippocratic%203.0-17160F">
</p>

---

This is the browser interface to a [lemonfiber](https://github.com/lemonfiber/lemonfiber)
stack. You do not install it on its own: the `lemonfiber` binary carries a
built copy and serves it.

```console
$ lemonfiber ui
lemonfiber is serving at:
  http://[::1]:49596
  http://127.0.0.1:49596
…
The token for this run, which the page will ask you for:
  417284f4…
```

Open the address, paste the token, and sign in. `lemonfiber ui --help` lists the
options, such as `--lan` to offer it to your network.

> **Status:** the console offers part of what the command line can do.
> [docs/surface-parity.md](docs/surface-parity.md) lists every request and every
> kind of answer it does not offer yet.

## How it works

It is a static application with no server of its own. It gets every piece of
data from lemonfiber's local
[web API](https://github.com/lemonfiber/spec/blob/main/20-architecture/contracts/web-api.md),
through the [`@lemonfiber/sdk-ts`](https://github.com/lemonfiber/sdk-ts) client,
and reaches nothing else: no CDN, no font host, no analytics. It decides nothing
itself; it asks lemonfiber and draws the answer.

On a version tag, [`publish.yml`](.github/workflows/publish.yml) pushes the build
output to a `built-<tag>` tag. The `lemonfiber` repository pins one of those
tags as a submodule at `assets/web` and embeds it in the binary. The build
declares the API version it speaks in `app.json`, and the binary refuses to
compile against an app that speaks a version it does not serve.

## The two views

The application serves two audiences, and they are **not** the same interface with
things hidden:

- **The console** — an operator's view. State, checks, logs, services, setup,
  household administration.
- **The household view** — what everyone else gets. What they asked for and where
  each request stands, whether asking needs approval and how much allowance is
  left, what they can watch, and what the household holds that they can.

Both are built from one component library and one set of tokens, so they cannot
drift apart visually. What differs is which of them a given person is served, and
that is decided by who signed in: one form takes the operator's password and a
household member's, and lemonfiber's answer names the member or nobody. Neither
the address nor a setting chooses, and neither view holds a permission —
lemonfiber refuses whatever a session may not have, whichever view sent it.

## Working on it

You need Node 26 or newer (`engines` in `package.json`).

```console
npm ci
npm run dev
```

The dev server draws the shell and the empty states only. It has no back end and
no proxy: the page asks lemonfiber at its own address. To see real data, serve
your build through the binary: `just ready` (once, to build the client), then
`npm run build` and `lemonfiber ui --assets dist`.

`npm ci` also turns on the repository's git hooks.

### The gate

```console
just ready     # once per clone, and again whenever the SDK moves
npm run ci
```

`npm run ci` is exactly what the `gate` job runs, which is the whole of CI over
this repository's own source — and it is not the whole of CI. `gate.yml` does two
things first that are **not** in the chain: `npm run client` builds the SDK this
surface is drawn through, and `playwright install` fetches the browser the
accessibility sweep drives. Without them the eleven steps run, reach `a11y`, and
fail there. `just ready` is those two, and `just ci` depends on it.

What the command leaves out is named in the [`justfile`](justfile) beside `just
ci`: the four commit rules, which `.githooks/commit-msg` refuses before the push;
`sdk-drift`, which compares every revision this surface pins in another lemonfiber
repository with that repository's default branch and with the lockfile; and the
forge-side jobs.

The individual steps are the `scripts` in [`package.json`](package.json), and each
runs on its own while you work — `npm test` for the fast loop, `npm run storybook`
to build a component in isolation, and `npm run a11y` to sweep every built story in
a browser (after `npm run storybook:build`).

The `lemonfiber` repository's standards apply here, in their web equivalents:
100% coverage across lines, statements, branches and functions; `strict`
TypeScript with `any` and non-null assertions banned; zero lint warnings
tolerated; architecture and file-size guards; every Svelte `a11y_` warning
refused at the compile, and accessibility asserted in the component tests and
swept over every built story in a browser. The
[spec page](https://github.com/lemonfiber/spec/blob/main/30-repos/lemonfiber-web.md)
maps each one to the workspace rule it mirrors.

## What it consumes

| From                                                         | What                                                                                           |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [`@lemonfiber/sdk-ts`](https://github.com/lemonfiber/sdk-ts) | State, actions and the event stream, over the web API; and the wire version the build declares |
| [`@lemonfiber/brand`](https://github.com/lemonfiber/brand)   | Colour, type, spacing, radii, the logo — at build time                                         |

Both are pinned in [`package.json`](package.json); that file is the version of
record, so nothing here restates it.

The type is the one thing not embedded. `src/app.css` names Golos Text for the
interface, Bricolage Grotesque for the wordmark and DM Mono for figures, and no
`@font-face` ships here — `@lemonfiber/brand` owns type and gives this repo the
tokens rather than the files. So each of the three falls back to the platform's
own stack wherever the face is not installed, and until the faces ship the
interface is identical across Linux, Windows and macOS in everything but its
lettering.

## Contributing

Every change cites a requirement in the
[specification](https://github.com/lemonfiber/spec); routine maintenance cites
`GOV-R12`. The [spec page for this repository](https://github.com/lemonfiber/spec/blob/main/30-repos/lemonfiber-web.md)
explains why it is shaped this way. Read the
[contributing guide](https://github.com/lemonfiber/spec/blob/main/50-governance/contributing.md)
and [AGENTS.md](AGENTS.md) first.

[Support](https://github.com/lemonfiber/.github/blob/main/SUPPORT.md) ·
[Security](https://github.com/lemonfiber/.github/blob/main/SECURITY.md) ·
[Code of conduct](https://github.com/lemonfiber/.github/blob/main/CODE_OF_CONDUCT.md)

## Licence

[Hippocratic License 3.0](LICENSE) — ethical-source, source-available,
deliberately not OSI-approved. See the
[rationale](https://github.com/lemonfiber/spec/blob/main/90-appendix/license-rationale.md).

lemonfiber is made by [NightWorksIO](https://nightworks.io).

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
