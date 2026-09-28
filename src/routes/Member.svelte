<script lang="ts">
  import { onMount } from "svelte";
  import Asked from "./Asked.svelte";
  import Away from "./Away.svelte";
  import Shelf from "./Shelf.svelte";
  import Shell from "./Shell.svelte";
  import type { Reaching } from "../api/asking";
  import {
    heard,
    knocked,
    REQUESTS,
    shelfOf,
    type Answer,
    type Heard,
  } from "../api/member";
  import { answeredAt, silentSince, type Freshness } from "../lib/freshness";
  import {
    memberMenu,
    pathOfRoom,
    readOf,
    whereabouts,
    type Room,
    type Whereabouts,
  } from "../lib/rooms";
  import { ours } from "../lib/route";
  import type { Access, Household } from "../lib/wire";
  import type { Shelf as Held } from "../lib/yours";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What reaching this run takes. */
    reaching: Reaching;
    /** The household member the door said this session is for. */
    member: string;
    /** What being turned away asks for, with what lemonfiber said. */
    onrefused: (said: string) => void;
  }

  let { reaching, member, onrefused }: Props = $props();

  /** How often every stamp on the screen is worked out again. */
  const A_TICK = 1000;

  /** A source that has not answered yet stamps nothing. */
  const UNSTAMPED: Freshness = { kind: "never" };

  let where = $state<Whereabouts>(whereabouts(globalThis.location.pathname));
  let own = $state<Heard<Household> | undefined>(undefined);
  let kept = $state<Household | undefined>(undefined);
  let keptAt = $state<number | undefined>(undefined);
  let shelf = $state<Heard<Held> | undefined>(undefined);
  let shelfAt = $state<number | undefined>(undefined);
  let away = $state<Answer<string> | undefined>(undefined);
  let now = $state(Date.now());

  /** How many askings this screen has made, which is what tells the latest. */
  let asking = 0;

  /** Whether the latest asking about them went unanswered. */
  const quiet = $derived(own?.at === "unanswered");

  /**
   * When what they asked for was last answered: answered, or quiet since then
   * where the latest asking went unanswered.
   */
  const asked = $derived(stampOf(keptAt, quiet, now));
  const watched = $derived(own?.at === "answered" ? asked : UNSTAMPED);
  const stocked = $derived(
    shelfAt === undefined ? UNSTAMPED : answeredAt(shelfAt, now),
  );

  /** What they may watch, as this arrival's asking answered it and no other. */
  const access = $derived(accessOf(own));

  function stampOf(
    at: number | undefined,
    silent: boolean,
    clock: number,
  ): Freshness {
    if (at === undefined) return UNSTAMPED;
    return silent ? silentSince(at, clock) : answeredAt(at, clock);
  }

  function accessOf(
    answer: Heard<Household> | undefined,
  ): Heard<readonly Access[]> | undefined {
    if (answer?.at !== "answered") return answer;
    return {
      at: "answered",
      value: answer.value.members.map((one) => one.access),
    };
  }

  /**
   * Go to one of their rooms, where the browser was not asked for something
   * this page cannot give.
   */
  function go(to: Room, event: MouseEvent): void {
    if (!ours(event)) return;
    event.preventDefault();
    globalThis.history.pushState(undefined, "", pathOfRoom(to));
    arrive({ room: to });
  }

  /**
   * Arrive somewhere and ask what it is drawn from.
   *
   * What the last place was answered with is dropped on the way in, bar what
   * they asked for. A shelf or a limit read for another arrival is a copy of
   * what somebody may watch that nobody has confirmed since.
   */
  function arrive(to: Whereabouts): void {
    where = to;
    own = undefined;
    shelf = undefined;
    shelfAt = undefined;
    away = undefined;
    void ask(to);
  }

  /**
   * Ask what they asked for, and whatever else the place they are at is drawn
   * from, together.
   *
   * What they asked for is asked everywhere, because it is the one read that is
   * theirs wherever they stand. Refused, it is lemonfiber saying this session no
   * longer stands, and the page is put away whatever else was asked. Answered,
   * it is what settles that a refusal of the other read was about that read.
   */
  async function ask(to: Whereabouts): Promise<void> {
    asking += 1;
    const latest = asking;
    const theirs = heard(reaching, REQUESTS, "household");

    if ("away" in to) {
      const [mine, there] = await Promise.all([
        theirs,
        knocked(reaching, readOf(to.away)),
      ]);
      if (settled(latest, mine)) away = there;
      return;
    }

    if (to.room === "asked") {
      settled(latest, await theirs);
      return;
    }

    const [mine, held] = await Promise.all([
      theirs,
      heard(reaching, shelfOf(member), "held"),
    ]);
    if (!settled(latest, mine)) return;
    if (held.at === "refused") {
      turned(held.said);
      return;
    }
    shelf = held;
    shelfAt = held.at === "answered" ? Date.now() : undefined;
  }

  /**
   * Take what asking about them came to, and say whether anything else asked
   * alongside it is still worth drawing.
   *
   * An answer to an asking a later one has overtaken dates nothing, since it
   * would put a place the reader left on the one they are at. Being turned away
   * is not the place's own, and is passed on wherever the reader has gone.
   */
  function settled(latest: number, mine: Answer<Household>): boolean {
    if (mine.at === "refused") {
      turned(mine.said);
      return false;
    }
    if (latest !== asking) return false;

    own = mine;
    if (mine.at === "answered") {
      kept = mine.value;
      keptAt = Date.now();
    }
    return true;
  }

  /** Put the page away, carrying what lemonfiber said to the door. */
  function turned(said: string | undefined): void {
    onrefused(said ?? m.unlock_signed_out_prose());
  }

  onMount(() => {
    const back = (): void => {
      arrive(whereabouts(globalThis.location.pathname));
    };

    globalThis.addEventListener("popstate", back);
    void ask(where);
    const clock = globalThis.setInterval(() => {
      now = Date.now();
    }, A_TICK);

    return () => {
      globalThis.clearInterval(clock);
      globalThis.removeEventListener("popstate", back);
    };
  });
</script>

<!--
  What a household member is shown: what they asked for, and what the household
  holds that they can watch.

  Which of the two surfaces is drawn is decided by who signed in, and this is
  the one a member gets whatever address they opened. At an address that is one
  of the console's it asks lemonfiber the read that address is drawn from, and
  shows what lemonfiber said rather than an empty page.

  Nothing here holds a permission. What is drawn is what lemonfiber answered
  about the member this session is for, and a control this page does not draw is
  one lemonfiber refuses whoever reaches it.
-->
<Shell
  place={"room" in where ? where.room : undefined}
  menu={memberMenu}
  ongo={go}
>
  {#if "away" in where}
    <Away answer={away} />
  {:else if where.room === "held"}
    <Shelf {access} {watched} {shelf} freshness={stocked} />
  {:else}
    <Asked
      household={kept}
      freshness={asked}
      {quiet}
      onretry={() => {
        void ask(where);
      }}
    />
  {/if}
</Shell>
