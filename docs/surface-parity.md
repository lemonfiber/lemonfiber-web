# What this surface offers, and what it does not yet

The spec is canonical. Where this page and a requirement disagree, the
requirement is right and this page is a defect.

## What is asked

[`G1-R1`](https://github.com/lemonfiber/spec/blob/main/10-functional/features/g-ux/g1-interface-tiers.md#acceptance-criteria):

> Every action MUST be available from every surface, except where intrinsically
> unsuited, and such exceptions MUST be documented.

[`G1-R14`](https://github.com/lemonfiber/spec/blob/main/10-functional/features/g-ux/g1-interface-tiers.md#acceptance-criteria):

> Setup MUST be completable from all three surfaces that run on the host
> machine.

G1 lists the exceptions rather than leaving them to judgement, and says what
an action missing from a surface and missing from that list is: unbuilt, not
excepted. Two of its rows name this surface: serving the web interface, because
a surface cannot start itself, and machine-readable output, whose equivalent
here is the web API itself.

The web API is one half of this surface and the application is the other. The
API is lemonfiber's, and the application can offer only what it serves. This
page is about the application: what a person using the console in a browser can
actually reach.

## The measurement

The client carries 64 kinds of answer, and this console reads 26 of them.
Another surface can make 44 requests of the stack, and this console offers 25 of
them. 2 kinds and 1 request are offered elsewhere by rule, and 36 kinds and 18
requests are not offered yet.

[`src/offered.test.ts`](../src/offered.test.ts) is what those figures are
measured from. It classifies every kind `@lemonfiber/sdk-ts` names and every
request another surface can make as offered here, offered elsewhere with the
requirement that says so, or not offered yet with the feature it belongs to. It
fails on a kind nobody has classified, on a kind claimed read that nothing the
page imports reads, on a request claimed offered that no screen the console
draws walks, on something read or walked that is still listed as waiting, and
on this page stating a figure or a row those lists do not come to.

The kinds are read off the client. The requests are not in the client, which
asks for an action by whatever name it is handed, so the suite lists them as
lemonfiber's action table names them, with the setup walk, serving this
surface and replacing the certificate a paired phone pins beside them. A request lemonfiber adds is caught there only where it
answers with a kind the contract did not have before.

## Kinds read here

| Kind         | Where it is drawn                                                                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admission`  | the door a password opens                                                                                                                                                    |
| `archives`   | the disk: the backups this machine keeps                                                                                                                                     |
| `backup`     | the disk: where a backup was written, and what it covers, under its record                                                                                                   |
| `bandwidth`  | the settings: where the line stands, what that means, each limit, and what each download client is doing about it                                                            |
| `bundle`     | the checks: what a support bundle would hold, in full, or where it was written                                                                                               |
| `config`     | the settings: every setting, where each value came from, and what changing one came to                                                                                       |
| `dashboard`  | the overview, from the stream                                                                                                                                                |
| `doctor`     | the checks, and the checks about the disk                                                                                                                                    |
| `forms`      | the forms the controls act on                                                                                                                                                |
| `household`  | the requests, and what running the household left it as                                                                                                                      |
| `invitation` | the requests: what offering somebody an account, or a new password, would make or made                                                                                       |
| `job`        | each record of work handed to the runtime                                                                                                                                    |
| `lifecycle`  | what a start, stop, switch, restart or fetch came to, under its record                                                                                                       |
| `log`        | the logs                                                                                                                                                                     |
| `pairing`    | the settings: the line a phone's code carries, the short form of the certificate's fingerprint to check on the phone, and what would make a paired phone refuse this machine |
| `preview`    | what starting the forms chosen would come to                                                                                                                                 |
| `quality`    | the settings: the quality new media is fetched at, and what putting the recorded preset back came to                                                                         |
| `repair`     | the checks: what can be put right, chosen from, and what putting it right came to                                                                                            |
| `restore`    | the disk: what an archive holds and what putting it back would overwrite, or what it put back                                                                                |
| `seed`       | what wiring the programs, or keeping edits made by hand, came to, under its record                                                                                           |
| `start`      | what a start is still waiting for, from the stream                                                                                                                           |
| `status`     | how the stack stands, and each program in it                                                                                                                                 |
| `undo`       | the checks: what putting back the last repair came to                                                                                                                        |
| `update`     | the settings: every step moving onto this build's pins would take, and how each service ended once it moved                                                                  |
| `upgrade`    | the settings: what fetching the library again would cost, and what it started                                                                                                |
| `error`      | every refusal, read by the client and handed over as a sentence                                                                                                              |

## Kinds served by no endpoint

| Kind    | Rule    | Why                                                                                                                                                              |
| ------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pull`  | `G1-R1` | the lines the command line writes while it fetches, under `--json`; G1 lists `--json` as unsuited to the web, and fetching is offered through the `pull` request |
| `setup` | `G1-R1` | what the command line's own setup writes under `--json`; the setup a browser walks answers with `wizard`                                                         |

## Kinds not read yet

| Kind           | Feature | What it is                                                                                               |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `adoption`     | A5      | Migration: what taking over a setup already here came to                                                 |
| `alerts`       | B5      | Notifications: what the operator is told about                                                           |
| `beside`       | A5      | Migration: standing beside a setup already here                                                          |
| `catalogue`    | F2      | Service catalogue: what each service is for                                                              |
| `certificate`  | N1      | Companion app: what replacing the certificate a paired phone pins came to; lemonfiber serves no endpoint |
| `clients`      | G6      | Client apps: which app to watch on                                                                       |
| `credentials`  | A7      | Credential management: every credential, with no values                                                  |
| `front-door`   | G5      | The front door, asked for on its own                                                                     |
| `glossary`     | G2      | Plain language: every word there is to ask about                                                         |
| `held`         | D8      | Parental controls: what one member can watch                                                             |
| `history`      | E4      | Rollback: everything lemonfiber changed                                                                  |
| `hosting`      | B10     | Hosting: what keeps running when no terminal is open                                                     |
| `import`       | A5      | Migration: copying an operator's records across                                                          |
| `migration`    | A5      | Migration: what is already on this machine                                                               |
| `music`        | D2      | Quality presets: the music format                                                                        |
| `outbound`     | G8      | Privacy: everything that leaves this machine                                                             |
| `plugins`      | F6      | Plugin lifecycle; lemonfiber serves no endpoint for it                                                   |
| `provenance`   | F2      | Service catalogue: where each service comes from                                                         |
| `removal`      | D6      | Household identity: somebody taken out of the household                                                  |
| `replacement`  | A5      | Migration: standing in place of a setup already here                                                     |
| `reset`        | C9      | Drift: what a full reset would revert                                                                    |
| `self-update`  | E2      | Self-update: where this copy stands                                                                      |
| `space`        | D5      | Disk space: where the room went                                                                          |
| `step`         | D3      | First content: one step of a walkthrough, from the stream                                                |
| `stop-seeding` | D5      | Disk space: letting one completed download go                                                            |
| `stored`       | A6      | Uninstall: everything lemonfiber keeps on this machine                                                   |
| `stuck`        | C7      | Queue health, asked for on its own                                                                       |
| `substitution` | F4      | Capabilities: which service fills one; lemonfiber serves no endpoint                                     |
| `trace`        | D9      | Pipeline trace: where one item is                                                                        |
| `uninstall`    | A6      | Uninstall: what a removal would come to                                                                  |
| `version`      | E2      | Self-update: the versions in play                                                                        |
| `walkthrough`  | D3      | First content: how far a walk got                                                                        |
| `watch`        | C5      | Storage: how a guard over the data location ended                                                        |
| `wiring`       | D1      | Auto-wiring: what is wired to what; lemonfiber serves no endpoint                                        |
| `wizard`       | A2      | Setup: where setup stands                                                                                |
| `word`         | G2      | Plain language: what one word means; `Term` asks for it, and no screen draws a `Term`                    |

Four of these wait on lemonfiber rather than on this surface: no endpoint
answers with `certificate`, `plugins`, `substitution` or `wiring`, so nothing
here could read them.

## Requests offered here

| Request             | Where                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `up`                | the overview, against the forms chosen or all                                                                              |
| `down`              | the overview, against the forms chosen or all                                                                              |
| `switch`            | the overview, against the forms chosen                                                                                     |
| `restart`           | the overview, against the forms chosen                                                                                     |
| `pull`              | the overview, against the forms chosen                                                                                     |
| `seed`              | the overview, for the whole stack                                                                                          |
| `adopt`             | the overview, for the whole stack                                                                                          |
| `repair`            | the checks: the offer first, then the repairs chosen from it, named by the offer they were read in                         |
| `diagnose`          | the checks, after a question saying the tunnel goes away for a moment                                                      |
| `accept`            | the checks, one warning at a time, after a question                                                                        |
| `undo`              | the checks: the last repair, after a question                                                                              |
| `backup`            | the disk, for the whole stack, after a question saying it writes settings and no media while the stack is stopped          |
| `restore`           | the disk: the listing first, then the archive put back, named by the listing it was read in                                |
| `support`           | the checks: every file a bundle would hold, read in full, then the bundle written on the terms it was read under           |
| `quality-reapply`   | the settings, where the config was edited by hand, after a question saying the edits are lost                              |
| `quality-upgrade`   | the settings: the cost first, then the library fetched again on a yes under it                                             |
| `config-set`        | the settings: made at once where it costs nothing, otherwise the review first and the change on a yes under it             |
| `invite`            | the requests: what the offer would make first, then the account offered on a yes under it, on the terms it was read on     |
| `reissue`           | the requests, under each person, after a question saying they cannot sign in until they set a new password                 |
| `household-allow`   | the requests: for the whole house, and under each person, a policy and a limit over a period                               |
| `household-approve` | the requests, under each person, for each request waiting on the operator                                                  |
| `household-decline` | the requests, under each person, for each request waiting on the operator, with the reason the person who asked is given   |
| `companion-pair`    | the settings: fresh pairing material for the companion app, made at once, since it carries no credential and admits nobody |
| `bandwidth`         | the settings: the limits typed, as they were typed, made at once; or the limits lifted for the minutes typed               |
| `update`            | the settings: every step first, then the move on a yes under it, letting downloads finish first where asked                |

Seven of these are offered in part. `backup` takes the whole stack; lemonfiber
also takes a backup of one service, and this console has no control for that
yet. `support` writes the bundle where lemonfiber keeps its own files, and the
newest one written is handed to the browser to be saved; showing a setting as
it is (`reveal`) has no control yet.
`quality-upgrade` states what an hour of each kind of media takes at the preset
in force, and no total, because the `upgrade` reading carries none.
`quality-reapply` lists the lines it replaced once it has, and not before,
because no action takes a rehearsal over the web API.
`invite` names no libraries, because no reading this console takes lists them;
an account it makes opens every library, and one offered again keeps the
libraries it had. It shows the address an offer is claimed at and no QR code
of it yet (`D6-R4`). `companion-pair` shows the line a phone's code carries and
no code a camera reads yet (`N1-R6`). `update` moves the whole stack; lemonfiber
also moves one service, and this console has no control for that yet.

## Requests unsuited to this surface

| Request | Rule    | The equivalent                                                                                       |
| ------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `ui`    | `G1-R1` | the address bar: a surface cannot start itself, and being able to ask is proof it is already serving |

## Requests not offered yet

| Request                 | Feature | What it is                                                                                                     |
| ----------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `quality-set`           | D2      | Quality presets: choose one; the reading names no presets to choose from                                       |
| `migrate-adopt`         | A5      | Migration: take over a setup already here                                                                      |
| `migrate-beside`        | A5      | Migration: stand beside it                                                                                     |
| `migrate-replace`       | A5      | Migration: stand in its place                                                                                  |
| `migrate-import`        | A5      | Migration: copy its records across                                                                             |
| `reset`                 | C9      | Drift: revert every edit to lemonfiber's own state                                                             |
| `forget`                | A6      | Uninstall: remove everything lemonfiber keeps                                                                  |
| `uninstall`             | A6      | Uninstall: one of four removals                                                                                |
| `space`                 | D5      | Disk space: take what costs nothing                                                                            |
| `stop-seeding`          | D5      | Disk space: let one completed download go                                                                      |
| `remove`                | D6      | Household identity: take somebody out; D6-R17 makes the yes the removal offer, and lemonfiber takes a bare yes |
| `watch`                 | C5      | Storage: guard the data location while forms run                                                               |
| `hosting-install`       | B10     | Hosting: keep a command running                                                                                |
| `hosting-remove`        | B10     | Hosting: stop keeping it                                                                                       |
| `walkthrough`           | D3      | First content: add one thing, end to end                                                                       |
| `search`                | D9      | Pipeline trace: follow one item with a live search                                                             |
| `setup`                 | A2      | Setup wizard, walked in a browser                                                                              |
| `companion-certificate` | N1      | Companion app: replace the certificate a paired phone pins; lemonfiber takes it at the command line only       |
