# lemonfiber-web

The web surface: an operator console and a household view, drawn from the JSON
API the `lemonfiber` binary serves.

Two surfaces, one component library. The console is everything an operator
needs; the household view is asking for something and seeing whether it is
ready, and nothing else. They are not the same interface with parts hidden.

- **What it is** — [`30-repos/lemonfiber-web.md`](https://github.com/lemonfiber/spec/blob/main/30-repos/lemonfiber-web.md)
- **Why it is separate** — [ADR-0011](https://github.com/lemonfiber/spec/blob/main/00-overview/decisions/0011-web-surface-as-a-fifth-repo.md)
- **How it ships** — [ADR-0012](https://github.com/lemonfiber/spec/blob/main/00-overview/decisions/0012-web-assets-embedded-at-build-time.md)

It talks to the core only through [`@lemonfiber/sdk-ts`](https://github.com/lemonfiber/sdk-ts)
and takes its colour, type and spacing from `@lemonfiber/brand`. It hardcodes
neither.

## Status

Early. The gates are in place; the components are not written yet.
