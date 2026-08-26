<script lang="ts">
  import { onMount } from "svelte";
  import Checks from "./Checks.svelte";
  import Dashboard from "./Dashboard.svelte";
  import Logs from "./Logs.svelte";
  import Requests from "./Requests.svelte";
  import Shell from "./Shell.svelte";
  import Storage from "./Storage.svelte";
  import type { Kind, Reading } from "@lemonfiber/sdk-ts";
  import { acting, type Acted } from "../api/acting";
  import {
    asked,
    carrying,
    scrollback,
    turnedAway,
    watching,
    type Reaching,
  } from "../api/asking";
  import {
    BETWEEN_ASKS,
    pausing as waiting,
    redeeming,
    type Pausing,
    type Redeemed,
  } from "../api/redeeming";
  import type { Flow } from "../lib/flow";
  import type { Freshness } from "../lib/freshness";
  import { ours, pathOf, placeAt, type Place } from "../lib/route";
  import type {
    Diagnosis,
    Forms,
    Household,
    Logged,
    Moment,
    Stack,
  } from "../lib/wire";
  import {
    costly,
    givenFor,
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

  /** What the stream calls the payload this screen is drawn from. */
  const MOMENTS = "dashboard" satisfies Kind;

  /** What the stream calls a line said while a wait is still waiting. */
  const WAITING = "start" satisfies Kind;

  /** How many milliseconds make a second. */
  const A_SECOND = 1000;

  /** A source that has not answered yet stamps nothing. */
  const UNSTAMPED: Freshness = { kind: "never" };

  let place = $state<Place>(placeAt(globalThis.location.pathname));
  let stack = $state<Reading<Stack> | undefined>(undefined);
  let programs = $state<Reading<Stack> | undefined>(undefined);
  let forms = $state<Reading<Forms> | undefined>(undefined);
  let chosen = $state<readonly string[]>([]);
  let diagnosis = $state<Reading<Diagnosis> | undefined>(undefined);
  let aboutDisk = $state<Reading<Diagnosis> | undefined>(undefined);
  let lines = $state<Reading<readonly Logged[]> | undefined>(undefined);
  let household = $state<Reading<Household> | undefined>(undefined);
  let stamped = $state<Freshness>(UNSTAMPED);
  let moment = $state<Moment | undefined>(undefined);
  let flow = $state<Flow>("opening");
  let read = $state<Freshness>({ kind: "never" });
  let live = $state<Freshness>({ kind: "never" });
  let work = $state<readonly Work[]>([]);
  let waitingSaid = $state<string | undefined>(undefined);
  let confirming = $state<Doing | undefined>(undefined);
  let busy = $state(false);
  let listening = $state(false);

  /** What ends the listening there is, for as long as there is one. */
  let gate = new AbortController();

  /** When the last moment arrived, for measuring a silence against. */
  let carried = 0;

  /** How many things this tab has asked for, which is what names each record. */
  let counted = 0;

  /** Whether this screen is still being looked at. */
  let here = true;

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
    stamped = UNSTAMPED;
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
      case "checks":
        diagnosis = noted(await asked(reaching, "checks", "doctor"));
        return;
      case "storage":
        aboutDisk = noted(await asked(reaching, "storage", "doctor"));
        return;
      case "logs":
        lines = noted(await scrollback(reaching));
        return;
      case "requests":
        household = noted(await asked(reaching, "requests", "household"));
        return;
    }
  }

  /**
   * Take what an endpoint answered, and say when it answered.
   */
  function noted<T>(answer: Reading<T>): Reading<T> {
    stamped = { kind: "answered", secondsAgo: 0 };
    if (turnedAway(answer)) onrefused();
    return answer;
  }

  /**
   * Ask every reading at once.
   *
   * Three endpoints, asked together: the whole stack's condition, each service
   * in it, and the forms the stack declares. The forms are what the controls
   * act on and are not something this page can hold in advance, so they are
   * asked for with the rest rather than when a control is first pressed.
   */
  async function ask(): Promise<void> {
    const [whole, each, declared] = await Promise.all([
      asked(reaching, "status", "status"),
      asked(reaching, "services", "status"),
      asked(reaching, "forms", "forms"),
    ]);

    stack = whole;
    programs = each;
    forms = declared;
    read = { kind: "answered", secondsAgo: 0 };

    if (turnedAway(whole, each, declared)) onrefused();
  }

  /**
   * Listen to the stream until this screen is put away.
   *
   * Whether anything is still listening is held, so the screen can say so. A
   * stream that opened and broke is reopened a few times; one that never opened
   * is tried once, and a stream that has given up looks from here exactly like
   * one that is still trying.
   */
  function listen(): void {
    const opening = new AbortController();
    gate = opening;
    const opened = watching(reaching, opening.signal);
    if (!opened.ok) {
      flow = "lost";
      return;
    }

    listening = true;
    void (async () => {
      for await (const arrival of opened.arrivals) {
        if (opening.signal.aborted) break;
        if (arrival.at === "lost") {
          lost();
        } else if (carrying(arrival, MOMENTS)) {
          moment = arrival.data;
          carried = Date.now();
          if (arrival.at === "live") {
            flow = "live";
            live = { kind: "answered", secondsAgo: 0 };
          } else {
            flow = "stale";
            live = {
              kind: "silent",
              secondsAgo: arrival.quietForMs / A_SECOND,
            };
          }
        } else if (carrying(arrival, WAITING)) {
          waitingSaid = arrival.data;
        }
      }
      listening = false;
    })();
  }

  /**
   * Open the stream again, for a connection nothing is opening on its own.
   *
   * Reopening is what a stream that carried and broke is given; a first opening
   * that failed is not one of those and is tried once. So the asking is the
   * operator's to make, and it is made from the banner that says so.
   */
  function reopen(): void {
    gate.abort();
    flow = "opening";
    listen();
  }

  /**
   * A connection that carried figures and stopped leaves them on the screen and
   * says how long ago they were true. One that never carried any has nothing to
   * date.
   */
  function lost(): void {
    if (moment === undefined) {
      flow = "lost";
      return;
    }
    flow = "stale";
    live = { kind: "silent", secondsAgo: (Date.now() - carried) / A_SECOND };
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

    const scoped = chosen.length > 0;
    confirming = undefined;
    busy = true;
    const came = await acting(reaching, doing, givenFor(doing, chosen));
    busy = false;

    if (came.at === "turned-away") {
      onrefused();
      return;
    }

    counted += 1;
    const id = String(counted);
    work = [recorded(id, doing, scoped, came), ...work];
    if (came.at === "started") void follow(id, came.job);
  }

  /**
   * What was asked for and what came back, as one record.
   */
  function recorded(
    id: string,
    doing: Doing,
    scoped: boolean,
    came: Exclude<Acted, { at: "turned-away" }>,
  ): Work {
    switch (came.at) {
      case "started":
        return { id, doing, scoped, at: "under-way", job: came.job };
      case "settled":
        return { id, doing, scoped, at: "done", job: undefined };
      case "declined":
        return { id, doing, scoped, at: "declined", said: came.said };
    }
  }

  /**
   * Keep asking what became of one name until there is something to say.
   *
   * The asking stops when the record it belongs to is put away, and when the
   * screen is. Neither is a reason to keep a request going, and a page nobody
   * is looking at must not be one of the reasons lemonfiber is asked anything.
   */
  async function follow(id: string, job: string): Promise<void> {
    let came = await redeeming(reaching, job);
    while (came.at === "running") {
      await pausing(BETWEEN_ASKS);
      if (!here || !kept(id)) return;
      came = await redeeming(reaching, job);
    }

    if (came.at === "turned-away") {
      onrefused();
      return;
    }
    work = work.map((one) => (one.id === id ? became(one, job, came) : one));
  }

  /** Whether the record a name was followed for is still on the screen. */
  function kept(id: string): boolean {
    return work.some((one) => one.id === id);
  }

  /**
   * One record, as what became of the work it named leaves it.
   */
  function became(
    one: Work,
    job: string,
    came: Exclude<Redeemed, { at: "running" | "turned-away" }>,
  ): Work {
    const { id, doing, scoped } = one;
    switch (came.at) {
      case "finished":
        return { id, doing, scoped, at: "done", job };
      case "stopped":
        return { id, doing, scoped, at: "stopped", said: came.said };
      case "forgotten":
        return { id, doing, scoped, at: "forgotten", job };
      case "adrift":
        return { id, doing, scoped, at: "adrift", job, said: came.said };
    }
  }

  const controls = $derived<Controls>({
    forms,
    chosen,
    work,
    waiting: waitingSaid,
    confirming,
    busy,
    onchoose: (form: string) => {
      // A question names what it is about, and what it is about is what has
      // been chosen. Changing that leaves a question standing over a different
      // request from the one it asked, so it is withdrawn rather than answered.
      confirming = undefined;
      chosen = chosen.includes(form)
        ? chosen.filter((one) => one !== form)
        : [...chosen, form];
    },
    onpress: (doing: Doing) => {
      void press(doing);
    },
    onleave: () => {
      confirming = undefined;
    },
    ondrop: (id: string) => {
      work = work.filter((one) => one.id !== id);
    },
    onhush: () => {
      waitingSaid = undefined;
    },
  });

  onMount(() => {
    const back = (): void => {
      arrive(placeAt(globalThis.location.pathname));
    };

    globalThis.addEventListener("popstate", back);
    void askFor(place);
    listen();

    return () => {
      here = false;
      globalThis.removeEventListener("popstate", back);
      gate.abort();
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

  The disk is the one screen with two sources: the volume comes off the stream,
  which is where it is measured, and the checks about it come off a reading.
-->
<Shell {place} ongo={go}>
  {#if place === "overview"}
    <Dashboard
      {stack}
      {programs}
      {moment}
      {flow}
      {read}
      {live}
      {controls}
      onretry={listening ? undefined : reopen}
    />
  {:else if place === "checks"}
    <Checks {diagnosis} freshness={stamped} />
  {:else if place === "storage"}
    <Storage
      disk={moment?.storage}
      {live}
      diagnosis={aboutDisk}
      read={stamped}
    />
  {:else if place === "logs"}
    <Logs scrollback={lines} freshness={stamped} />
  {:else}
    <Requests {household} freshness={stamped} />
  {/if}
</Shell>
