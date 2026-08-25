<script lang="ts">
  import { onMount } from "svelte";
  import Panel from "../components/Panel.svelte";
  import Value from "../components/Value.svelte";
  import Dashboard from "./Dashboard.svelte";
  import Shell from "./Shell.svelte";
  import type { Kind, Reading } from "@lemonfiber/sdk-ts";
  import { acting, type Acted } from "../api/acting";
  import {
    asked,
    carrying,
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
  import { nameOf, ours, pathOf, placeAt, type Place } from "../lib/route";
  import type { Forms, Moment, Stack } from "../lib/wire";
  import {
    costly,
    givenFor,
    type Controls,
    type Doing,
    type Work,
  } from "../lib/work";
  import * as m from "../paraglide/messages.js";

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

  /** A screen nothing has been built for yet stamps nothing. */
  const UNSTAMPED: Freshness = { kind: "never" };

  let place = $state<Place>(placeAt(globalThis.location.pathname));
  let stack = $state<Reading<Stack> | undefined>(undefined);
  let programs = $state<Reading<Stack> | undefined>(undefined);
  let forms = $state<Reading<Forms> | undefined>(undefined);
  let chosen = $state<readonly string[]>([]);
  let moment = $state<Moment | undefined>(undefined);
  let flow = $state<Flow>("opening");
  let read = $state<Freshness>({ kind: "never" });
  let live = $state<Freshness>({ kind: "never" });
  let work = $state<readonly Work[]>([]);
  let waitingSaid = $state<string | undefined>(undefined);
  let confirming = $state<Doing | undefined>(undefined);
  let busy = $state(false);

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
    place = to;
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
   */
  function listen(): () => void {
    const gate = new AbortController();
    const opened = watching(reaching, gate.signal);
    if (!opened.ok) {
      flow = "lost";
      return () => undefined;
    }

    void (async () => {
      for await (const arrival of opened.arrivals) {
        if (gate.signal.aborted) break;
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
    })();

    return () => {
      gate.abort();
    };
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
      place = placeAt(globalThis.location.pathname);
    };

    globalThis.addEventListener("popstate", back);
    void ask();
    const stop = listen();

    return () => {
      here = false;
      globalThis.removeEventListener("popstate", back);
      stop();
    };
  });
</script>

<!--
  The operator's console: where the page is, and everything it has been told.

  The readings and the stream are asked for once, here, and handed down. A screen
  is given what it draws rather than fetching it, which is what lets the same
  screen be drawn from a fixture in a story and swept for the things a browser
  can only be asked about once a whole page is assembled.
-->
<Shell {place} ongo={go}>
  {#if place === "overview"}
    <Dashboard {stack} {programs} {moment} {flow} {read} {live} {controls} />
  {:else}
    <Panel title={nameOf(place)} freshness={UNSTAMPED}>
      <Value state="unknown" absent={m.home_unfinished()} />
    </Panel>
  {/if}
</Shell>
