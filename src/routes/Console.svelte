<script lang="ts">
  import { onMount } from "svelte";
  import Checks from "./Checks.svelte";
  import Raised from "./Raised.svelte";
  import Dashboard from "./Dashboard.svelte";
  import Logs from "./Logs.svelte";
  import Requests from "./Requests.svelte";
  import Settings from "./Settings.svelte";
  import Shell from "./Shell.svelte";
  import Lockup from "../components/Lockup.svelte";
  import Storage from "./Storage.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { asked, scrollback, turnedAway, type Reaching } from "../api/asking";
  import { heldIn, runningOf } from "../lib/copying";
  import { Explained, handExplained } from "../lib/explained.svelte";
  import { pausing as waiting, type Pausing } from "../api/redeeming";
  import { Desk } from "./desk.svelte";
  import { asksAt } from "./asks";
  import { Saving } from "./saving.svelte";
  import { Listening } from "./listening.svelte";
  import { Tracing } from "./tracing.svelte";
  import { shelving } from "./shelving";
  import { Keying } from "./keying.svelte";
  import {
    readChecks,
    readSettings,
    readStorage,
    type Answered,
    type ChecksRead,
    type SettingsRead,
    type StorageRead,
  } from "./readings";
  import type { Sought } from "../lib/finding";
  import type { Playing } from "../lib/playing";
  import type { Stuck } from "../lib/stuck";
  import type { Guidance } from "../lib/clients";
  import type { Mend, Mender } from "../lib/mending";
  import { answeredAt, carriedAt, type Freshness } from "../lib/freshness";
  import type { Hosted } from "../lib/removed";
  import { agreedStop, type Offered } from "../lib/restarting";
  import { stoppingForms } from "../lib/inflight";
  import { placeChangedBy } from "../lib/rereading";
  import { ours, pathOf, placeAt, type Place } from "../lib/places";
  import { consoleMenu } from "../lib/route";
  import type {
    Diagnosis,
    Forms,
    Household,
    Logged,
    Preview,
    Stack,
  } from "../lib/wire";
  import {
    costly,
    givenFor,
    isDoing,
    type Controls,
    type Doing,
    type Work,
  } from "../lib/work";

  interface Props {
    /** What reaching this run takes. */
    reaching: Reaching;
    /** What a refusal asks for. */
    onrefused: () => void;
    /** How the wait between one asking about a job and the next is taken. */
    pausing?: Pausing | undefined;
  }

  let { reaching, onrefused, pausing = waiting }: Props = $props();

  /** How often every stamp on the screen is worked out again. */
  const A_TICK = 1000;

  /** A source that has not answered yet stamps nothing. */
  const UNSTAMPED: Freshness = { kind: "never" };

  let place = $state<Place>(placeAt(globalThis.location.pathname));
  let stack = $state<Reading<Stack> | undefined>(undefined);
  let programs = $state<Reading<Stack> | undefined>(undefined);
  let forms = $state<Reading<Forms> | undefined>(undefined);
  let hosted = $state<Reading<Hosted> | undefined>(undefined);
  let playing = $state<Reading<Playing> | undefined>(undefined);
  let chosen = $state<readonly string[]>([]);
  let preview = $state<Reading<Preview> | undefined>(undefined);
  let previewedAt = $state<number | undefined>(undefined);
  let diagnosis = $state<Reading<Diagnosis> | undefined>(undefined);
  let disk = $state<StorageRead | undefined>(undefined);
  let checked = $state<ChecksRead | undefined>(undefined);
  let stuck = $state<Reading<Stuck> | undefined>(undefined);
  let clients = $state<Reading<Guidance> | undefined>(undefined);
  let lines = $state<Reading<readonly Logged[]> | undefined>(undefined);
  let household = $state<Reading<Household> | undefined>(undefined);
  let setup = $state<SettingsRead | undefined>(undefined);
  let stampedAt = $state<number | undefined>(undefined);
  let readAt = $state<number | undefined>(undefined);
  let now = $state(Date.now());
  let confirming = $state<Doing | undefined>(undefined);
  let picked = $state<readonly string[]>([]);

  /** The live connection, and what it last carried. */
  const stream = new Listening(() => reaching);

  /** How terms are explained where they stand, kept per browser. */
  const explained = handExplained(new Explained());

  /** Whether this screen is still being looked at. */
  let here = true;

  /**
   * Every stamp on the screen, worked out against the clock rather than written
   * down when the source answered.
   */
  const stamped = $derived(
    stampedAt === undefined ? UNSTAMPED : answeredAt(stampedAt, now),
  );
  const read = $derived(
    readAt === undefined ? UNSTAMPED : answeredAt(readAt, now),
  );
  const live = $derived(carriedAt(stream.carriedAt, stream.flow, now));

  /**
   * The backup or restore running now: as the stream last said it where it
   * has said it, and as the disk screen's reading answered where it has not.
   */
  const running = $derived(runningOf(stream.copying ?? heldIn(disk?.copying)));
  const copied = $derived(stream.copying === undefined ? stamped : live);
  const previewed = $derived(
    previewedAt === undefined ? UNSTAMPED : answeredAt(previewedAt, now),
  );

  /**
   * Go somewhere the menu leads, where the browser was not asked for something
   * this page cannot give.
   */
  function go(to: Place, event: MouseEvent): void {
    if (!ours(event)) return;
    event.preventDefault();
    globalThis.history.pushState(undefined, "", pathOf(to));
    arrive(to);
  }

  /**
   * Arrive somewhere and ask what that place is drawn from.
   *
   * The stamp is dropped on the way in. It says when the reading behind the
   * screen being read answered, and the one left behind by the screen before it
   * would date this one by another screen's clock. Leaving the overview puts
   * away the word that alerts may be missing, which its being open has shown.
   */
  function arrive(to: Place): void {
    if (place === "overview" && to !== "overview") stream.seen();
    place = to;
    stampedAt = undefined;
    void askFor(to);
  }

  /**
   * Ask the endpoint the place being read is drawn from.
   *
   * One place, one asking. A screen nobody is looking at is not worth a request,
   * and the scrollback least of all — it is the one read that is answered by
   * however many lines the services have written.
   */
  async function askFor(where: Place): Promise<void> {
    switch (where) {
      case "overview":
        await ask();
        return;
      case "checks": {
        checked = all(where, await readChecks(reaching));
        diagnosis = checked.diagnosis;
        return;
      }
      case "storage":
        disk = all(where, await readStorage(reaching));
        return;
      case "logs":
        lines = noted(where, await scrollback(reaching));
        return;
      case "requests": {
        const [house, held, apps] = await Promise.all([
          asked(reaching, "requests", "household"),
          asked(reaching, "stuck", "stuck"),
          asked(reaching, "clients", "clients"),
        ]);
        household = noted(where, house);
        stuck = noted(where, held);
        clients = noted(where, apps);
        return;
      }
      case "settings": {
        const [read] = await Promise.all([
          readSettings(reaching),
          keying.read(),
        ]);
        setup = all(where, read);
        return;
      }
    }
  }

  /**
   * Take what an endpoint answered, and say when it answered.
   *
   * The stamp is the screen's own, and this is called by whichever request
   * resolved rather than by whichever screen is being read. An answer that
   * landed after the reader moved on dates nothing: it would put one screen's
   * clock on another's. Being turned away is not the screen's own and is passed
   * on wherever the reader has gone.
   */
  function noted<T>(where: Place, answer: Reading<T>): Reading<T> {
    if (where === place) stampedAt = Date.now();
    if (turnedAway(answer)) onrefused();
    return answer;
  }

  /** Take every reading a screen was drawn from, as one answer. */
  function all<T>(where: Place, answered: Answered<T>): T {
    if (where === place) stampedAt = Date.now();
    if (answered.refused) onrefused();
    return answered.read;
  }

  /**
   * Ask every reading at once.
   *
   * Five endpoints, asked together: the whole stack's condition, each service
   * in it, the forms the stack declares, what this machine keeps running, and
   * what the media server is playing now. The forms are what the controls act
   * on and are not something this page can hold in advance, so they are asked
   * for with the rest rather than when a control is first pressed.
   */
  async function ask(): Promise<void> {
    const [whole, each, declared, kept, watched] = await Promise.all([
      asked(reaching, "status", "status"),
      asked(reaching, "services", "status"),
      asked(reaching, "forms", "forms"),
      asked(reaching, "hosting", "hosting"),
      asked(reaching, "playing", "playing"),
    ]);

    stack = whole;
    programs = each;
    forms = declared;
    hosted = kept;
    playing = watched;
    readAt = Date.now();

    if (turnedAway(whole, each, declared, kept, watched)) onrefused();
  }

  /**
   * Ask what starting the forms chosen would come to, before anything starts.
   *
   * Asked whenever what is chosen changes, so the answer is on the screen before
   * the control that starts them is pressed. Every chosen form is named to the
   * read, which answers for all of them together: a program two of them share
   * starts once and is counted once. An answer that arrives after the choice
   * moved on is about a choice nobody is looking at, and is dropped.
   */
  async function rehearse(forms: readonly string[]): Promise<void> {
    preview = undefined;
    previewedAt = undefined;
    if (forms.length === 0) return;

    const asking = [...forms];
    const answer = await asked(reaching, "forms", "preview", { form: asking });
    if (chosen.join("\n") !== asking.join("\n")) return;
    preview = answer;
    previewedAt = Date.now();
    if (turnedAway(answer)) onrefused();
  }

  /**
   * Ask lemonfiber for something, having asked about it first where it costs,
   * sending only what the action's command takes: lemonfiber refuses anything
   * else rather than dropping it.
   */
  async function press(doing: Doing, wait = false): Promise<void> {
    if (costly(doing) && confirming !== doing) {
      confirming = doing;
      void desk.interrupting.read(stoppingForms(chosen));
      return;
    }
    confirming = undefined;
    await desk.send(doing, chosen.length > 0, givenFor(doing, chosen, wait));
  }

  /**
   * What a record that came to an end changes on the screen.
   *
   * A run of the checks is the reading the checks screen draws, so one that
   * came back replaces it. Anything else that changed a screen's reading has
   * that screen read again.
   */
  function settled(record: Work): void {
    if (record.at !== "done") return;
    if (record.came.kind === "doctor") {
      diagnosis = noted("checks", { ok: true, value: record.came.report });
      return;
    }
    const changed = placeChangedBy(record.came);
    if (changed !== undefined) void askFor(changed);
  }

  /** Where every asking goes, and what a refused key asks for. */
  const handing = {
    reaching: () => reaching,
    onrefused: () => {
      onrefused();
    },
  };
  const desk = new Desk({
    ...handing,
    pausing: () => pausing,
    here: () => here,
    settled,
  });
  const asks = asksAt(desk);

  const mender = $derived<Mender>({
    ...asks.mend.asker,
    picked,
    onask: (asking: Mend) => {
      // Asking for the offer again replaces the one the repairs were chosen
      // from, so what was chosen from it goes with it.
      if (asking.doing === "repair") picked = [];
      void asks.mend.ask(asking);
    },
    onpick: (check: string) => {
      picked = picked.includes(check)
        ? picked.filter((one) => one !== check)
        : [...picked, check];
    },
  });

  const keeper = $derived(asks.keep.asker);
  const saving = new Saving(handing);
  const saver = $derived(saving.saver);
  const tracing = new Tracing(handing);
  const tracer = $derived(tracing.tracer);

  /** Follow one item to its trace, which the requests screen draws. */
  function follow(sought: Sought): void {
    void tracing.look(sought);
    globalThis.history.pushState(undefined, "", pathOf("requests"));
    arrive("requests");
  }
  const shelves = shelving(handing);
  const keying = new Keying(handing);
  const keyer = $derived(keying.keyer);
  const tender = $derived(asks.tend.asker);
  const finder = $derived(asks.find.asker);

  const controls = $derived<Controls>({
    forms,
    chosen,
    preview,
    previewed,
    work: desk.of(isDoing),
    waiting: stream.waitingSaid,
    confirming,
    busy: desk.busy,
    onchoose: (form: string) => {
      confirming = undefined;
      chosen = chosen.includes(form)
        ? chosen.filter((one) => one !== form)
        : [...chosen, form];
      void rehearse(chosen);
    },
    onpress: (doing: Doing) => {
      void press(doing);
    },
    onfinish: () => {
      void press("down", true);
    },
    inflight: desk.interrupting.of,
    onleave: () => {
      confirming = undefined;
    },
    ondrop: (id: string) => {
      desk.drop(id);
    },
    onhush: () => {
      stream.waitingSaid = undefined;
    },
    onrestart: (offered: Offered) => {
      void desk.answer(offered, offered.doing, agreedStop(offered));
    },
  });

  onMount(() => {
    const back = (): void => {
      arrive(placeAt(globalThis.location.pathname));
    };

    globalThis.addEventListener("popstate", back);
    void askFor(place);
    explained.read(reaching, onrefused);
    stream.listen();
    const clock = globalThis.setInterval(() => {
      now = Date.now();
    }, A_TICK);

    return () => {
      here = false;
      globalThis.clearInterval(clock);
      globalThis.removeEventListener("popstate", back);
      stream.stop();
    };
  });
</script>

<!--
  The operator's console: where the page is, and everything it has been told.

  The stream is opened here, and opened again from here when the operator asks
  for it. A reading is asked for on the way into the place it draws — one place,
  one asking — and the answer is handed down. A screen is given what it draws
  rather than fetching it, which is what lets the same screen be drawn from a
  fixture in a story and swept for the things a browser can only be asked about
  once a whole page is assembled.

  The disk is the one screen with more than one source: the volume comes off the
  stream, which is where it is measured, and the checks about it, the backups
  kept on it and the accounting of its completed downloads come off readings
  asked for together.
-->
<Shell {place} menu={consoleMenu} ongo={go}>
  {#snippet brand()}<Lockup />{/snippet}
  {#if stream.told !== undefined}
    <Raised
      told={stream.told}
      ondismiss={() => {
        stream.dismiss();
      }}
    />
  {/if}
  {#if place === "overview"}
    <Dashboard
      {stack}
      {programs}
      moment={stream.moment}
      flow={stream.flow}
      missing={stream.missing}
      {read}
      {live}
      {controls}
      hosting={{ hoster: asks.host.asker, hosted }}
      {playing}
      runner={asks.run.asker}
      onretry={stream.listening
        ? undefined
        : () => {
            stream.reopen();
          }}
    />
  {:else if place === "checks"}
    <Checks
      {...checked}
      {diagnosis}
      onfollow={follow}
      mover={asks.move.asker}
      freshness={stamped}
      {mender}
      {keeper}
      {saver}
    />
  {:else if place === "storage"}
    <Storage
      disk={stream.moment?.storage}
      {live}
      diagnosis={disk?.diagnosis}
      read={stamped}
      keeping={{ keeper, archives: disk?.archives, services: disk?.services }}
      remover={asks.remove.asker}
      letting={{ letter: asks.letGo.asker, space: disk?.space }}
      reclaiming={{ reclaimer: asks.reclaim.asker, space: disk?.space }}
      copying={running === undefined
        ? undefined
        : { running, freshness: copied }}
    />
  {:else if place === "logs"}
    <Logs scrollback={lines} freshness={stamped} />
  {:else if place === "requests"}
    <Requests
      {household}
      freshness={stamped}
      {tender}
      {finder}
      walking={stream.steps}
      {tracer}
      shelving={shelves}
      {stuck}
      {clients}
    />
  {:else}
    <Settings
      {...setup}
      quality={setup?.quality}
      glossary={explained.glossary}
      freshness={stamped}
      tuner={asks.tune.asker}
      filler={asks.fill.asker}
      plugger={asks.plug.asker}
      revoker={asks.revoke.asker}
      valuer={asks.value.asker}
      {keyer}
      configurer={asks.change.asker}
      pairer={asks.pair.asker}
      sharer={asks.share.asker}
      updater={asks.update.asker}
    />
  {/if}
</Shell>
