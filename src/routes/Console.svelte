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
  import type { Flow } from "../lib/flow";
  import type { Freshness } from "../lib/freshness";
  import { nameOf, ours, pathOf, placeAt, type Place } from "../lib/route";
  import type { Moment, Stack } from "../lib/wire";
  import { costly, type Controls, type Doing, type Work } from "../lib/work";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What reaching this run takes. */
    reaching: Reaching;
    /** What a refusal asks for. */
    onrefused: () => void;
  }

  let { reaching, onrefused }: Props = $props();

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
  let moment = $state<Moment | undefined>(undefined);
  let flow = $state<Flow>("opening");
  let read = $state<Freshness>({ kind: "never" });
  let live = $state<Freshness>({ kind: "never" });
  let work = $state<readonly Work[]>([]);
  let waiting = $state<string | undefined>(undefined);
  let confirming = $state<Doing | undefined>(undefined);
  let busy = $state(false);

  /** When the last moment arrived, for measuring a silence against. */
  let carried = 0;

  /** How many things this tab has asked for, which is what names each record. */
  let counted = 0;

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
   * Ask both readings at once.
   *
   * Two endpoints, asked together: the whole stack's condition and each service
   * in it. They are one command behind the surface today and are asked
   * separately anyway, so narrowing the roster to named forms later changes one
   * call rather than the screen.
   */
  async function ask(): Promise<void> {
    const [whole, each] = await Promise.all([
      asked(reaching, "status", "status"),
      asked(reaching, "services", "status"),
    ]);

    stack = whole;
    programs = each;
    read = { kind: "answered", secondsAgo: 0 };

    if (turnedAway(whole, each)) onrefused();
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
          waiting = arrival.data;
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
   * The reply is the whole of what this page is told: work handed to the runtime
   * is answered with a name and goes on without this request, so what is kept is
   * the record of having asked rather than a wait for an outcome that never
   * arrives here.
   */
  async function press(doing: Doing): Promise<void> {
    if (costly(doing) && confirming !== doing) {
      confirming = doing;
      return;
    }

    confirming = undefined;
    busy = true;
    const came = await acting(reaching, doing, {
      forms: [],
      confirm: costly(doing),
    });
    busy = false;

    if (came.at === "turned-away") {
      onrefused();
      return;
    }

    counted += 1;
    work = [recorded(String(counted), doing, came), ...work];
  }

  /**
   * What was asked for and what came back, as one record.
   */
  function recorded(
    id: string,
    doing: Doing,
    came: Exclude<Acted, { at: "turned-away" }>,
  ): Work {
    switch (came.at) {
      case "started":
        return { id, doing, at: "under-way", job: came.job };
      case "settled":
        return { id, doing, at: "done" };
      case "declined":
        return { id, doing, at: "declined", said: came.said };
    }
  }

  const controls = $derived<Controls>({
    work,
    waiting,
    confirming,
    busy,
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
      waiting = undefined;
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
