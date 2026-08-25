<script lang="ts">
  import Banner from "../components/Banner.svelte";
  import Attention from "./panels/Attention.svelte";
  import Coming from "./panels/Coming.svelte";
  import Programs from "./panels/Programs.svelte";
  import Space from "./panels/Space.svelte";
  import Standing from "./panels/Standing.svelte";
  import Waiting from "./panels/Waiting.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { saidOfFlow, toneOfFlow, type Flow } from "../lib/flow";
  import type { Freshness } from "../lib/freshness";
  import type { Moment, Stack } from "../lib/wire";

  interface Props {
    /** What the whole stack amounts to, from the reading of it. */
    stack: Reading<Stack> | undefined;
    /** What each service is doing, from the reading of them. */
    programs: Reading<Stack> | undefined;
    /** The newest moment the live connection delivered. */
    moment: Moment | undefined;
    /** What the live connection is doing. */
    flow: Flow;
    /** When the two readings last answered. */
    read: Freshness;
    /** When the live connection last delivered. */
    live: Freshness;
  }

  let { stack, programs, moment, flow, read, live }: Props = $props();

  const said = $derived(saidOfFlow(flow));
  const graded = $derived(moment === undefined ? read : live);
</script>

<!--
  The operator's first screen: what the stack amounts to, what it is holding, and
  what has stopped.

  Two sources fill it and neither waits for the other. The readings answer once
  and give the screen something to draw before any connection is open; the live
  connection replaces what it can as it arrives. Each panel stamps whichever of
  the two filled it, so one of them falling behind is visible in the panels it
  fed and nowhere else.

  The banner speaks for the connection rather than for any panel. A screen whose
  figures were true a minute ago is a claim about the whole screen, and a panel
  cannot make it.
-->
<div class="board">
  {#if said !== undefined}
    <Banner tone={toneOfFlow(flow)} lead={said.lead} prose={said.prose} />
  {/if}

  <div class="pair">
    <Standing {stack} health={moment?.health} freshness={graded} />
    <Space disk={moment?.storage} freshness={live} />
  </div>

  <Attention stuck={moment?.stuck} freshness={live} />

  <Programs {programs} freshness={read} />

  <div class="pair">
    <Coming transfers={moment?.transfers} freshness={live} />
    <Waiting queues={moment?.queue} freshness={live} />
  </div>
</div>

<style>
  .board {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-4);
    align-content: start;
  }

  /* A panel is allowed to be narrower than the widest thing inside it. What
     does not fit scrolls inside its own frame — a table inside its wrapper, a
     picture inside its own — rather than taking the page sideways. Without
     this a grid track is floored at its contents, and one wide picture sets
     the width of the screen. */
  .board > :global(*),
  .pair > :global(*) {
    min-width: 0;
  }

  /* Two panels of equal weight, stacked until there is room for both. The
     tracks are floored at nothing rather than at their contents, so a panel
     that cannot fit shrinks instead of taking the page sideways. */
  .pair {
    display: grid;
    gap: var(--sp-4);
  }

  @media (min-width: 62rem) {
    .pair {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }
</style>
