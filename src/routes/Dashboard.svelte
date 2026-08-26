<script lang="ts">
  import Action from "../components/Action.svelte";
  import Banner from "../components/Banner.svelte";
  import Attention from "./panels/Attention.svelte";
  import Coming from "./panels/Coming.svelte";
  import Forms from "./panels/Forms.svelte";
  import Programs from "./panels/Programs.svelte";
  import Running from "./panels/Running.svelte";
  import Space from "./panels/Space.svelte";
  import Standing from "./panels/Standing.svelte";
  import Waiting from "./panels/Waiting.svelte";
  import Board from "./Board.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { saidOfFlow, toneOfFlow, type Flow } from "../lib/flow";
  import type { Freshness } from "../lib/freshness";
  import type { Moment, Stack } from "../lib/wire";
  import type { Controls } from "../lib/work";
  import * as m from "../paraglide/messages.js";

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
    /** What can be asked of the stack, and what has come of asking. */
    controls: Controls;
    /**
     * What asking for the live connection again does. Omitted while something
     * is still opening it, which is a connection with nothing to press.
     */
    onretry?: (() => void) | undefined;
  }

  let { stack, programs, moment, flow, read, live, controls, onretry }: Props =
    $props();

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
  cannot make it. Where nothing is opening the connection any more it carries the
  one control that asks for it, since a screen saying contact was lost and
  offering nothing to press leaves reloading the page as the only way back.

  The two panels that act sit under the two that grade, so what is on offer is
  read after what it is for. The forms come first of the two: what the controls
  reach is chosen there, and a control read before the thing it acts on is a
  control read without its subject.
-->
<Board>
  {#if said !== undefined}
    {#snippet again()}
      <Action label={m.action_try_again()} onclick={onretry} />
    {/snippet}
    <Banner
      tone={toneOfFlow(flow)}
      lead={said.lead}
      prose={said.prose}
      actions={onretry === undefined ? undefined : again}
    />
  {/if}

  <div class="pair">
    <Standing {stack} health={moment?.health} freshness={graded} />
    <Space disk={moment?.storage} freshness={live} />
  </div>

  <Forms
    forms={controls.forms}
    chosen={controls.chosen}
    onchoose={controls.onchoose}
    freshness={read}
  />

  <Running {...controls} freshness={live} />

  <Attention stuck={moment?.stuck} freshness={live} />

  <Programs {programs} freshness={read} />

  <div class="pair">
    <Coming transfers={moment?.transfers} freshness={live} />
    <Waiting queues={moment?.queue} freshness={live} />
  </div>
</Board>

<style>
  /* Each of the two is allowed to be narrower than the widest thing inside it,
     for the reason the column that holds them both states. */
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
