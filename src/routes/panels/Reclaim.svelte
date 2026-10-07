<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { linesOf } from "../../lib/came";
  import { bytes } from "../../lib/figures";
  import type { Freshness } from "../../lib/freshness";
  import type { Reckoned } from "../../lib/letting";
  import { offeredBytes, partLine } from "../../lib/reclaimed";
  import type { Reclaimer } from "../../lib/reclaiming";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The disk accounting, or why it could not be read. */
    space: Reading<Reckoned> | undefined;
    /** What taking back the room that costs nothing asks for, and what came of it. */
    reclaimer: Reclaimer;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { space, reclaimer, freshness }: Props = $props();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  const reckoned = $derived(space?.ok === true ? space.value : undefined);
  const problem = $derived(
    space?.ok === false ? space.problem.message : undefined,
  );
  const parted = $derived(reclaimer.work.length > 0);
</script>

<!--
  What of the disk could be got back, what each part would cost, and taking
  back what costs nothing.

  The accounting is the offer, and it names itself. The yes stands under the
  parts it names and carries that name, so what is taken is what was read or
  lemonfiber refuses. Only the parts that cost nothing are taken; the rest are
  said with their cost and left with the operator.
-->
<Panel title={m.panel_room()} {freshness} flush>
  <div class="scope">
    <p>{m.reclaim_prose()}</p>
    {#if reckoned === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if reckoned === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {:else if reckoned.reclaimable.length === 0}
      <p>{m.reclaim_none()}</p>
    {/if}
  </div>

  {#if reckoned !== undefined && reckoned.reclaimable.length > 0}
    {@const offer = reckoned.agreement}
    {@const free = offeredBytes(reckoned)}
    <div class="parts">
      <ul class="lines" aria-label={m.reclaim_said()}>
        {#each reckoned.reclaimable as part, at (at)}
          <li><span class="word">{partLine(part)}</span></li>
        {/each}
      </ul>
      {#if free > 0}
        <p>{m.reclaim_offer()}</p>
        <Action
          label={m.action_reclaim_yes({ size: bytes(free) })}
          weight="firm"
          off={reclaimer.busy}
          onclick={() => {
            reclaimer.onask({ doing: "space", offer });
            landing();
          }}
        />
      {:else}
        <p>{m.reclaim_free_none()}</p>
      {/if}
    </div>
  {/if}

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.reclaim_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#each reclaimer.work as one (one.id)}
      {@const said = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            reclaimer.ondrop(one.id);
            landing();
          }}
        />
      {/snippet}
      <Item
        state={said.state}
        eyebrow={said.eyebrow}
        title={titleOfDoing(one.doing, one.scoped)}
        prose={said.prose}
        lines={one.at === "done"
          ? { named: m.came_heading(), said: linesOf(one.came) }
          : undefined}
        actions={dropping}
      />
    {/each}
  </div>
</Panel>

<style>
  .scope {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--panel-pad) var(--sp-3);
  }

  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .parts {
    display: grid;
    gap: var(--sp-3);
    justify-items: start;
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  .lines {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .lines li {
    font-size: var(--text-prose);
    color: var(--muted);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  /* The rule appears only when there is something under it, so a panel nobody
     has asked anything of ends at its own border rather than at a spare line. */
  .parted {
    border-top: 1px solid var(--line);
  }

  /* Focus is put here after a row is taken away, and it is not a place the tab
     order stops at, so the ring would mark somewhere nobody steered to. */
  .asked:focus {
    outline: none;
  }
</style>
