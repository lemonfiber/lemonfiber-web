<script lang="ts">
  import { onMount } from "svelte";
  import Checks from "./Checks.svelte";
  import Dashboard from "./Dashboard.svelte";
  import Logs from "./Logs.svelte";
  import Requests from "./Requests.svelte";
  import Settings from "./Settings.svelte";
  import Shell from "./Shell.svelte";
  import Storage from "./Storage.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { asked, scrollback, turnedAway, type Reaching } from "../api/asking";
  import { pausing as waiting, type Pausing } from "../api/redeeming";
  import { Asked, Desk } from "./desk.svelte";
  import { Saving } from "./saving.svelte";
  import { Listening } from "./listening.svelte";
  import { Tracing } from "./tracing.svelte";
  import {
    readSettings,
    readStorage,
    type Answered,
    type SettingsRead,
    type StorageRead,
  } from "./readings";
  import type { Flow } from "../lib/flow";
  import type { History } from "../lib/history";
  import type { Stuck } from "../lib/stuck";
  import { mending, type Mend, type Mender } from "../lib/mending";
  import { answeredAt, silentSince, type Freshness } from "../lib/freshness";
  import { configuring } from "../lib/configuring";
  import { finding } from "../lib/finding";
  import { pairing } from "../lib/pairing";
  import { sharing } from "../lib/sharing";
  import { updating } from "../lib/updating";
  import { tending } from "../lib/tending";
  import { tuning } from "../lib/tuning";
  import { upkeep } from "../lib/upkeep";
  import { hosting } from "../lib/hosting";
  import type { Hosted } from "../lib/removed";
  import { removing } from "../lib/removing";
  import { reclaiming } from "../lib/reclaiming";
  import { lettingGo } from "../lib/seeding";
  import { placeChangedBy } from "../lib/rereading";
  import { consoleMenu, ours, pathOf, placeAt, type Place } from "../lib/route";
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
  let chosen = $state<readonly string[]>([]);
  let preview = $state<Reading<Preview> | undefined>(undefined);
  let previewedAt = $state<number | undefined>(undefined);
  let diagnosis = $state<Reading<Diagnosis> | undefined>(undefined);
  let disk = $state<StorageRead | undefined>(undefined);
  let history = $state<Reading<History> | undefined>(undefined);
  let stuck = $state<Reading<Stuck> | undefined>(undefined);
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

  /** Whether this screen is still being looked at. */
  let here = true;

  /**
   * What the live connection's own stamp says.
   *
   * A connection that is carrying dates its figures from when they arrived; one
   * that has stopped dates them from the same moment and says how long it has
   * been quiet since. One that has never carried has nothing to date.
   */
  function dated(
    at: number | undefined,
    doing: Flow,
    clock: number,
  ): Freshness {
    if (at === undefined) return UNSTAMPED;
    return doing === "live" ? answeredAt(at, clock) : silentSince(at, clock);
  }

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
  const live = $derived(dated(stream.carriedAt, stream.flow, now));
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
   * would date this one by another screen's clock.
   */
  function arrive(to: Place): void {
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
        const [found, changed] = await Promise.all([
          asked(reaching, "checks", "doctor"),
          asked(reaching, "history", "history"),
        ]);
        diagnosis = noted(where, found);
        history = noted(where, changed);
        return;
      }
      case "storage":
        disk = all(where, await readStorage(reaching));
        return;
      case "logs":
        lines = noted(where, await scrollback(reaching));
        return;
      case "requests": {
        const [house, held] = await Promise.all([
          asked(reaching, "requests", "household"),
          asked(reaching, "stuck", "stuck"),
        ]);
        household = noted(where, house);
        stuck = noted(where, held);
        return;
      }
      case "settings":
        setup = all(where, await readSettings(reaching));
        return;
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
   * Four endpoints, asked together: the whole stack's condition, each service
   * in it, the forms the stack declares, and what this machine keeps running.
   * The forms are what the controls act on and are not something this page
   * can hold in advance, so they are asked for with the rest rather than when
   * a control is first pressed.
   */
  async function ask(): Promise<void> {
    const [whole, each, declared, kept] = await Promise.all([
      asked(reaching, "status", "status"),
      asked(reaching, "services", "status"),
      asked(reaching, "forms", "forms"),
      asked(reaching, "hosting", "hosting"),
    ]);

    stack = whole;
    programs = each;
    forms = declared;
    hosted = kept;
    readAt = Date.now();

    if (turnedAway(whole, each, declared, kept)) onrefused();
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
   * Ask lemonfiber for something, having asked about it first where it costs.
   *
   * Only the arguments the action's command takes are sent. One it has nowhere
   * to put is refused rather than dropped, and a request that was refused for
   * carrying something nobody meant to send is a request the operator has to
   * make twice.
   */
  async function press(doing: Doing): Promise<void> {
    if (costly(doing) && confirming !== doing) {
      confirming = doing;
      return;
    }
    confirming = undefined;
    await desk.send(doing, chosen.length > 0, givenFor(doing, chosen));
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
  const mendAsks = new Asked(desk, mending);
  const keepAsks = new Asked(desk, upkeep);
  const tuneAsks = new Asked(desk, tuning);
  const changeAsks = new Asked(desk, configuring);
  const tendAsks = new Asked(desk, tending);
  const pairAsks = new Asked(desk, pairing);
  const shareAsks = new Asked(desk, sharing);
  const updateAsks = new Asked(desk, updating);
  const findAsks = new Asked(desk, finding);
  const hostAsks = new Asked(desk, hosting);
  const removeAsks = new Asked(desk, removing);
  const letAsks = new Asked(desk, lettingGo);
  const reclaimAsks = new Asked(desk, reclaiming);

  const mender = $derived<Mender>({
    ...mendAsks.asker,
    picked,
    onask: (asking: Mend) => {
      // Asking for the offer again replaces the one the repairs were chosen
      // from, so what was chosen from it goes with it.
      if (asking.doing === "repair") picked = [];
      void mendAsks.ask(asking);
    },
    onpick: (check: string) => {
      picked = picked.includes(check)
        ? picked.filter((one) => one !== check)
        : [...picked, check];
    },
  });

  const keeper = $derived(keepAsks.asker);
  const saving = new Saving(handing);
  const saver = $derived(saving.saver);
  const tracing = new Tracing(handing);
  const tracer = $derived(tracing.tracer);
  const tender = $derived(tendAsks.asker);
  const finder = $derived(findAsks.asker);

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
      // A question names what it is about, and what it is about is what has
      // been chosen. Changing that leaves a question standing over a different
      // request from the one it asked, so it is withdrawn rather than answered.
      confirming = undefined;
      chosen = chosen.includes(form)
        ? chosen.filter((one) => one !== form)
        : [...chosen, form];
      void rehearse(chosen);
    },
    onpress: (doing: Doing) => {
      void press(doing);
    },
    onleave: () => {
      confirming = undefined;
    },
    ondrop: (id: string) => {
      desk.drop(id);
    },
    onhush: () => {
      stream.waitingSaid = undefined;
    },
  });

  onMount(() => {
    const back = (): void => {
      arrive(placeAt(globalThis.location.pathname));
    };

    globalThis.addEventListener("popstate", back);
    void askFor(place);
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
  {#if place === "overview"}
    <Dashboard
      {stack}
      {programs}
      moment={stream.moment}
      flow={stream.flow}
      {read}
      {live}
      {controls}
      hosting={{ hoster: hostAsks.asker, hosted }}
      onretry={stream.listening
        ? undefined
        : () => {
            stream.reopen();
          }}
    />
  {:else if place === "checks"}
    <Checks
      {diagnosis}
      {history}
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
      keeping={{ keeper, archives: disk?.archives }}
      remover={removeAsks.asker}
      letting={{ letter: letAsks.asker, space: disk?.space }}
      reclaiming={{ reclaimer: reclaimAsks.asker, space: disk?.space }}
    />
  {:else if place === "logs"}
    <Logs scrollback={lines} freshness={stamped} />
  {:else if place === "requests"}
    <Requests
      {household}
      freshness={stamped}
      {tender}
      {finder}
      {tracer}
      {stuck}
    />
  {:else}
    <Settings
      quality={setup?.quality}
      settings={setup?.settings}
      line={setup?.line}
      outbound={setup?.outbound}
      credentials={setup?.credentials}
      versions={setup?.versions}
      standing={setup?.standing}
      freshness={stamped}
      tuner={tuneAsks.asker}
      configurer={changeAsks.asker}
      pairer={pairAsks.asker}
      sharer={shareAsks.asker}
      updater={updateAsks.asker}
    />
  {/if}
</Shell>
