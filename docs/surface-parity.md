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

The client carries 62 kinds of answer, and this console reads 19 of them.
Another surface can make 42 requests of the stack, and this console offers 14 of
them. 2 kinds and 1 request are offered elsewhere by rule, and 41 kinds and 27
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
lemonfiber's action table names them, with the setup walk and serving this
surface beside them. A request lemonfiber adds is caught there only where it
answers with a kind the contract did not have before.

## Kinds read here

| Kind        | Where it is drawn                                                                             |
| ----------- | --------------------------------------------------------------------------------------------- |
| `admission` | the door a password opens                                                                     |
| `archives`  | the disk: the backups this machine keeps                                                      |
| `backup`    | the disk: where a backup was written, and what it covers, under its record                    |
| `bundle`    | the checks: what a support bundle would hold, in full, or where it was written                |
| `dashboard` | the overview, from the stream                                                                 |
| `doctor`    | the checks, and the checks about the disk                                                     |
| `forms`     | the forms the controls act on                                                                 |
| `household` | the requests                                                                                  |
| `job`       | each record of work handed to the runtime                                                     |
| `lifecycle` | what a start, stop, switch, restart or fetch came to, under its record                        |
| `log`       | the logs                                                                                      |
| `preview`   | what starting the forms chosen would come to                                                  |
| `repair`    | the checks: what can be put right, chosen from, and what putting it right came to             |
| `restore`   | the disk: what an archive holds and what putting it back would overwrite, or what it put back |
| `seed`      | what wiring the programs, or keeping edits made by hand, came to, under its record            |
| `start`     | what a start is still waiting for, from the stream                                            |
| `status`    | how the stack stands, and each program in it                                                  |
| `undo`      | the checks: what putting back the last repair came to                                         |
| `error`     | every refusal, read by the client and handed over as a sentence                               |

## Kinds served by no endpoint

| Kind    | Rule    | Why                                                                                                                                                              |
| ------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pull`  | `G1-R1` | the lines the command line writes while it fetches, under `--json`; G1 lists `--json` as unsuited to the web, and fetching is offered through the `pull` request |
| `setup` | `G1-R1` | what the command line's own setup writes under `--json`; the setup a browser walks answers with `wizard`                                                         |

## Kinds not read yet

| Kind           | Feature | What it is                                                                            |
| -------------- | ------- | ------------------------------------------------------------------------------------- |
| `adoption`     | A5      | Migration: what taking over a setup already here came to                              |
| `alerts`       | B5      | Notifications: what the operator is told about                                        |
| `bandwidth`    | D10     | Bandwidth: how the line is shared                                                     |
| `beside`       | A5      | Migration: standing beside a setup already here                                       |
| `catalogue`    | F2      | Service catalogue: what each service is for                                           |
| `clients`      | G6      | Client apps: which app to watch on                                                    |
| `config`       | A4      | Reconfiguration: every setting, or one                                                |
| `credentials`  | A7      | Credential management: every credential, with no values                               |
| `front-door`   | G5      | The front door, asked for on its own                                                  |
| `glossary`     | G2      | Plain language: every word there is to ask about                                      |
| `held`         | D8      | Parental controls: what one member can watch                                          |
| `history`      | E4      | Rollback: everything lemonfiber changed                                               |
| `hosting`      | B10     | Hosting: what keeps running when no terminal is open                                  |
| `import`       | A5      | Migration: copying an operator's records across                                       |
| `invitation`   | D6      | Household identity: an account offered to somebody                                    |
| `migration`    | A5      | Migration: what is already on this machine                                            |
| `music`        | D2      | Quality presets: the music format                                                     |
| `outbound`     | G8      | Privacy: everything that leaves this machine                                          |
| `plugins`      | F6      | Plugin lifecycle; lemonfiber serves no endpoint for it                                |
| `provenance`   | F2      | Service catalogue: where each service comes from                                      |
| `quality`      | D2      | Quality presets: the choice in force                                                  |
| `removal`      | D6      | Household identity: somebody taken out of the household                               |
| `replacement`  | A5      | Migration: standing in place of a setup already here                                  |
| `reset`        | C9      | Drift: what a full reset would revert                                                 |
| `self-update`  | E2      | Self-update: where this copy stands                                                   |
| `space`        | D5      | Disk space: where the room went                                                       |
| `step`         | D3      | First content: one step of a walkthrough, from the stream                             |
| `stop-seeding` | D5      | Disk space: letting one completed download go                                         |
| `stored`       | A6      | Uninstall: everything lemonfiber keeps on this machine                                |
| `stuck`        | C7      | Queue health, asked for on its own                                                    |
| `substitution` | F4      | Capabilities: which service fills one; lemonfiber serves no endpoint                  |
| `trace`        | D9      | Pipeline trace: where one item is                                                     |
| `uninstall`    | A6      | Uninstall: what a removal would come to                                               |
| `update`       | E1      | Stack updates: what moving onto this build's pins would change                        |
| `upgrade`      | D2      | Quality presets: what fetching the library again would cost                           |
| `version`      | E2      | Self-update: the versions in play                                                     |
| `walkthrough`  | D3      | First content: how far a walk got                                                     |
| `watch`        | C5      | Storage: how a guard over the data location ended                                     |
| `wiring`       | D1      | Auto-wiring: what is wired to what; lemonfiber serves no endpoint                     |
| `wizard`       | A2      | Setup: where setup stands                                                             |
| `word`         | G2      | Plain language: what one word means; `Term` asks for it, and no screen draws a `Term` |

Three of these wait on lemonfiber rather than on this surface: no endpoint
answers with `plugins`, `substitution` or `wiring`, so nothing here could read
them.

## Requests offered here

| Request    | Where                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `up`       | the overview, against the forms chosen or all                                                                     |
| `down`     | the overview, against the forms chosen or all                                                                     |
| `switch`   | the overview, against the forms chosen                                                                            |
| `restart`  | the overview, against the forms chosen                                                                            |
| `pull`     | the overview, against the forms chosen                                                                            |
| `seed`     | the overview, for the whole stack                                                                                 |
| `adopt`    | the overview, for the whole stack                                                                                 |
| `repair`   | the checks: the offer first, then the repairs chosen from it, named by the offer they were read in                |
| `diagnose` | the checks, after a question saying the tunnel goes away for a moment                                             |
| `accept`   | the checks, one warning at a time, after a question                                                               |
| `undo`     | the checks: the last repair, after a question                                                                     |
| `backup`   | the disk, for the whole stack, after a question saying it writes settings and no media while the stack is stopped |
| `restore`  | the disk: the listing first, then the archive put back, named by the listing it was read in                       |
| `support`  | the checks: every file a bundle would hold, read in full, then the bundle written on the terms it was read under  |

Two of these are offered in part. `backup` takes the whole stack; lemonfiber
also takes a backup of one service, and this console has no control for that
yet. `support` writes the bundle where lemonfiber keeps its own files and says
where; the client reads every reply as text, so the file itself is not handed
to the browser, and showing a setting as it is (`reveal`) has no control yet.

## Requests unsuited to this surface

| Request | Rule    | The equivalent                                                                                       |
| ------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `ui`    | `G1-R1` | the address bar: a surface cannot start itself, and being able to ask is proof it is already serving |

## Requests not offered yet

| Request             | Feature | What it is                                                     |
| ------------------- | ------- | -------------------------------------------------------------- |
| `config-set`        | A4      | Reconfiguration: change one setting, shown before it is agreed |
| `quality-set`       | D2      | Quality presets: choose one                                    |
| `quality-reapply`   | D2      | Quality presets: assert the choice again                       |
| `quality-upgrade`   | D2      | Quality presets: fetch the library again at the bar in force   |
| `migrate-adopt`     | A5      | Migration: take over a setup already here                      |
| `migrate-beside`    | A5      | Migration: stand beside it                                     |
| `migrate-replace`   | A5      | Migration: stand in its place                                  |
| `migrate-import`    | A5      | Migration: copy its records across                             |
| `reset`             | C9      | Drift: revert every edit to lemonfiber's own state             |
| `forget`            | A6      | Uninstall: remove everything lemonfiber keeps                  |
| `uninstall`         | A6      | Uninstall: one of four removals                                |
| `space`             | D5      | Disk space: take what costs nothing                            |
| `stop-seeding`      | D5      | Disk space: let one completed download go                      |
| `bandwidth`         | D10     | Bandwidth: declare how the line is shared                      |
| `update`            | E1      | Stack updates: move onto this build's pins                     |
| `invite`            | D6      | Household identity: offer somebody an account                  |
| `remove`            | D6      | Household identity: take somebody out                          |
| `reissue`           | D6      | Household identity: let somebody set a new password            |
| `household-allow`   | D7      | Approval & quotas: what the household may ask for              |
| `household-approve` | D7      | Approval & quotas: approve a request                           |
| `household-decline` | D7      | Approval & quotas: decline a request                           |
| `watch`             | C5      | Storage: guard the data location while forms run               |
| `hosting-install`   | B10     | Hosting: keep a command running                                |
| `hosting-remove`    | B10     | Hosting: stop keeping it                                       |
| `walkthrough`       | D3      | First content: add one thing, end to end                       |
| `search`            | D9      | Pipeline trace: follow one item with a live search             |
| `setup`             | A2      | Setup wizard, walked in a browser                              |
