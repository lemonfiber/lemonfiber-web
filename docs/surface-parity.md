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

The client carries 72 kinds of answer, and this console reads 45 of them.
Another surface can make 54 requests of the stack, and this console offers 36 of
them. 2 kinds and 1 request are offered elsewhere by rule, and 25 kinds and 17
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
surface, replacing the certificate a paired phone pins, and minting, listing
and revoking keys beside them. A request lemonfiber adds is caught there only
where it answers with a kind the contract did not have before.

## Kinds read here

| Kind           | Where it is drawn                                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `admission`    | the door a password opens                                                                                                                                                                                                                                                                  |
| `alerts`       | the settings: the preset in force for what the operator is told about and what it means, and each kind of event set apart from it                                                                                                                                                          |
| `archives`     | the disk: the backups this machine keeps                                                                                                                                                                                                                                                   |
| `backup`       | the disk: where a backup was written, and what it covers, under its record                                                                                                                                                                                                                 |
| `bandwidth`    | the settings: where the line stands, what that means, each limit, and what each download client is doing about it                                                                                                                                                                          |
| `bundle`       | the checks: what a support bundle would hold, in full, or where it was written                                                                                                                                                                                                             |
| `catalogue`    | the settings: every service the stack holds, what it does, what going without it costs and how much that matters, and every service the stack dropped with why and what took its place                                                                                                     |
| `config`       | the settings: every setting, where each value came from, and what changing one came to                                                                                                                                                                                                     |
| `credentials`  | the settings: every credential the stack holds, where it stands, who made it, whose it is, where its value lives, the setting it is recorded under and what signs in with it, with no value; and what keeping them in files protects against and what it does not                          |
| `dashboard`    | the overview, from the stream                                                                                                                                                                                                                                                              |
| `doctor`       | the checks, and the checks about the disk                                                                                                                                                                                                                                                  |
| `forms`        | the forms the controls act on                                                                                                                                                                                                                                                              |
| `history`      | the checks: everything lemonfiber changed, newest first, with what made each change, when, how far it could be put back and what goes with it, under how far back the record goes                                                                                                          |
| `hosting`      | the overview: every command this machine can keep running, what each does, the command it runs and where it stands, and what keeping one or taking it back changed                                                                                                                         |
| `household`    | the requests, and what running the household left it as                                                                                                                                                                                                                                    |
| `invitation`   | the requests: what offering somebody an account, or a new password, would make or made                                                                                                                                                                                                     |
| `job`          | each record of work handed to the runtime                                                                                                                                                                                                                                                  |
| `lifecycle`    | what a start, stop, switch, restart or fetch came to, under its record                                                                                                                                                                                                                     |
| `log`          | the logs                                                                                                                                                                                                                                                                                   |
| `outbound`     | the settings: every request lemonfiber makes on its own account, where it goes, what travels, whether it is allowed, the setting that switches it off and what that costs; and every request the stack's services make, with whose it is                                                   |
| `pairing`      | the settings: the line a phone's code carries, the short form of the certificate's fingerprint to check on the phone, and what would make a paired phone refuse this machine                                                                                                               |
| `pausing`      | the settings: what pausing or resuming every download came to, each download client with what it was doing and what it read back                                                                                                                                                           |
| `playing`      | the overview: every session the media server is playing now, who is watching what on which device and whether it is paused, or that the media server could not be asked                                                                                                                    |
| `preview`      | what starting the forms chosen would come to                                                                                                                                                                                                                                               |
| `provenance`   | the settings: where each service comes from, beside what it is for: the image, the tag and digest it is pinned at, its licence and the project it is built from                                                                                                                            |
| `quality`      | the settings: the quality new media is fetched at, and what putting the recorded preset back came to                                                                                                                                                                                       |
| `repair`       | the checks: what can be put right, chosen from, and what putting it right came to                                                                                                                                                                                                          |
| `restore`      | the disk: what an archive holds and what putting it back would overwrite, or what it put back                                                                                                                                                                                              |
| `seed`         | what wiring the programs, or keeping edits made by hand, came to, under its record                                                                                                                                                                                                         |
| `self-update`  | the settings: where this copy of lemonfiber stands against the newest release, how it was installed, where it runs from, exactly what to type to move it or why not, and what a release brings                                                                                             |
| `space`        | the disk: the completed downloads the accounting names, what each takes up, where it stands and what removing it costs; every part that could be got back with what it would cost; and what taking back what costs nothing took and could not; the rest of the accounting is not drawn yet |
| `start`        | what a start is still waiting for, from the stream                                                                                                                                                                                                                                         |
| `status`       | how the stack stands, and each program in it                                                                                                                                                                                                                                               |
| `stop-seeding` | the disk: what letting one download go would cost and what goes with it, and what the client let go                                                                                                                                                                                        |
| `stored`       | the disk: everything lemonfiber keeps, where and why, what is beside it, and what forgetting it removed or left                                                                                                                                                                            |
| `stuck`        | the requests: every item whose download is stuck, the service holding it and the stage it stopped at, each followed to where it is on a press, under what may be missing from the list                                                                                                     |
| `trace`        | the requests: how far one item got, why it stopped, how sure the trace is, and what happened to it                                                                                                                                                                                         |
| `undo`         | the checks: what putting back the last repair came to                                                                                                                                                                                                                                      |
| `uninstall`    | the disk: every line a removal reaches, going or kept, with its size, what is coming down, what lemonfiber cannot remove and how to by hand, and what went                                                                                                                                 |
| `update`       | the settings: every step moving onto this build's pins would take, and how each service ended once it moved                                                                                                                                                                                |
| `upgrade`      | the settings: what fetching the library again would cost, and what it started                                                                                                                                                                                                              |
| `version`      | the settings: the running program, the stack it operates, what the container engine reports and the manifest schemas it reads; the changelog is not drawn yet                                                                                                                              |
| `walkthrough`  | the requests: what walking one thing through proved, every step it took, and where it stopped or what to do next                                                                                                                                                                           |
| `watch`        | the overview: why a guard over the data location ended, and the forms it stopped                                                                                                                                                                                                           |
| `error`        | every refusal, read by the client and handed over as a sentence                                                                                                                                                                                                                            |

## Kinds served by no endpoint

| Kind    | Rule    | Why                                                                                                                                                              |
| ------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pull`  | `G1-R1` | the lines the command line writes while it fetches, under `--json`; G1 lists `--json` as unsuited to the web, and fetching is offered through the `pull` request |
| `setup` | `G1-R1` | what the command line's own setup writes under `--json`; the setup a browser walks answers with `wizard`                                                         |

## Kinds not read yet

| Kind           | Feature  | What it is                                                                                               |
| -------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `adoption`     | A5       | Migration: what taking over a setup already here came to                                                 |
| `beside`       | A5       | Migration: standing beside a setup already here                                                          |
| `capabilities` | ARCH-R78 | What this copy of lemonfiber can do, each named by the path it is served at                              |
| `certificate`  | N1       | Companion app: what replacing the certificate a paired phone pins came to; lemonfiber serves no endpoint |
| `clients`      | G6       | Client apps: which app to watch on                                                                       |
| `front-door`   | G5       | The front door, asked for on its own                                                                     |
| `glossary`     | G2       | Plain language: every word there is to ask about                                                         |
| `handoff`      | G9       | Mobile handoff: where getting one person's phone onto the media server stands                            |
| `held`         | D8       | Parental controls: what one member can watch                                                             |
| `import`       | A5       | Migration: copying an operator's records across                                                          |
| `keys`         | C10      | Integration keys: every key, with no secret                                                              |
| `migration`    | A5       | Migration: what is already on this machine                                                               |
| `minted-key`   | C10      | Integration keys: one key just minted, its secret shown this once                                        |
| `music`        | D2       | Quality presets: the music format                                                                        |
| `news`         | N27      | What's new: the newest of each kind, from the stream                                                     |
| `news-items`   | N27      | What's new: everything newer than what was last seen, asked for                                          |
| `plugins`      | F6       | Plugin lifecycle: every plugin installed, and what installing, updating or removing one came to          |
| `removal`      | D6       | Household identity: somebody taken out of the household                                                  |
| `replacement`  | A5       | Migration: standing in place of a setup already here                                                     |
| `reset`        | C9       | Drift: what a full reset would revert                                                                    |
| `step`         | D3       | First content: one step of a walkthrough, from the stream                                                |
| `substitution` | F4       | Capabilities: which service fills one                                                                    |
| `wiring`       | D1       | Auto-wiring: what is wired to what                                                                       |
| `wizard`       | A2       | Setup: where setup stands                                                                                |
| `word`         | G2       | Plain language: what one word means; `Term` asks for it, and no screen draws a `Term`                    |

One of these waits on lemonfiber rather than on this surface: no endpoint
answers with `certificate`, so nothing here could read it.

## Requests offered here

| Request             | Where                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `up`                | the overview, against the forms chosen or all                                                                                          |
| `down`              | the overview, against the forms chosen or all                                                                                          |
| `switch`            | the overview, against the forms chosen                                                                                                 |
| `restart`           | the overview, against the forms chosen                                                                                                 |
| `pull`              | the overview, against the forms chosen                                                                                                 |
| `seed`              | the overview, for the whole stack                                                                                                      |
| `adopt`             | the overview, for the whole stack                                                                                                      |
| `repair`            | the checks: the offer first, then the repairs chosen from it, named by the offer they were read in                                     |
| `diagnose`          | the checks, after a question saying the tunnel goes away for a moment                                                                  |
| `accept`            | the checks, one warning at a time, after a question                                                                                    |
| `undo`              | the checks: the last repair, after a question                                                                                          |
| `backup`            | the disk, for the whole stack, after a question saying it writes settings and no media while the stack is stopped                      |
| `restore`           | the disk: the listing first, then the archive put back, named by the listing it was read in                                            |
| `support`           | the checks: every file a bundle would hold, read in full, then the bundle written on the terms it was read under                       |
| `quality-reapply`   | the settings, where the config was edited by hand, after a question saying the edits are lost                                          |
| `quality-upgrade`   | the settings: the cost first, then the library fetched again on a yes under it                                                         |
| `config-set`        | the settings: made at once where it costs nothing, otherwise the review first and the change on a yes under it                         |
| `invite`            | the requests: what the offer would make first, then the account offered on a yes under it, on the terms it was read on                 |
| `reissue`           | the requests, under each person, after a question saying they cannot sign in until they set a new password                             |
| `household-allow`   | the requests: for the whole house, and under each person, a policy and a limit over a period                                           |
| `household-approve` | the requests, under each person, for each request waiting on the operator                                                              |
| `household-decline` | the requests, under each person, for each request waiting on the operator, with the reason the person who asked is given               |
| `companion-pair`    | the settings: fresh pairing material for the companion app, made at once, since it carries no credential and admits nobody             |
| `bandwidth`         | the settings: the limits typed, as they were typed, made at once; or the limits lifted for the minutes typed                           |
| `downloads-pause`   | the settings: every download client paused at once, since a pause holds until it is resumed                                            |
| `downloads-resume`  | the settings: every download client resumed at once, with whatever would stop them again                                               |
| `update`            | the settings: every step first, then the move on a yes under it, letting downloads finish first where asked                            |
| `watch`             | the overview, against the forms chosen                                                                                                 |
| `walkthrough`       | the requests: the thing named, or something likely to work, after a question saying it fetches it                                      |
| `search`            | the requests: one item followed with the indexers asked, beside looking it up without asking them                                      |
| `hosting-install`   | the overview: one command kept running after a question naming what it does, the guard against the forms chosen                        |
| `hosting-remove`    | the overview: one command taken back after a question naming what stops                                                                |
| `forget`            | the disk: everything kept listed first, then forgotten on a yes under the listing                                                      |
| `uninstall`         | the disk: one of four removals listed first, then carried out on a yes naming that listing, letting downloads finish first where asked |
| `stop-seeding`      | the disk: one download still being shared, its cost read first, then let go on a yes naming that offer                                 |
| `space`             | the disk: what costs nothing to get back, taken on a yes naming the accounting it was read in                                          |

Eight of these are offered in part. `backup` takes the whole stack; lemonfiber
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
`walkthrough` shows every step it took once the walk ends; the steps the stream
carries while it runs (`step`) are not drawn yet.

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
| `remove`                | D6      | Household identity: take somebody out; D6-R17 makes the yes the removal offer, and lemonfiber takes a bare yes |
| `household-handoff`     | G9      | Mobile handoff: issue one person a code pointing an app at the media server, and check a device signed in      |
| `setup`                 | A2      | Setup wizard, walked in a browser                                                                              |
| `companion-certificate` | N1      | Companion app: replace the certificate a paired phone pins; lemonfiber takes it at the command line only       |
| `wiring-fill`           | F4      | Capabilities: choose which service fills one, from the offer read first                                        |
| `plugin-install`        | F6      | Plugin lifecycle: install one, from the offer read first                                                       |
| `plugin-update`         | F6      | Plugin lifecycle: update one, from the offer read first                                                        |
| `plugin-remove`         | F6      | Plugin lifecycle: remove one, from the offer read first                                                        |
| `key-mint`              | C10     | Integration keys: mint one, with the password in the same request                                              |
| `key-list`              | C10     | Integration keys: list them                                                                                    |
| `key-revoke`            | C10     | Integration keys: revoke one                                                                                   |
