<script lang="ts">
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import { spanFor, type Freshness } from "../../lib/freshness";
  import { stateOfStall, wordOfStall, type Stall } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What has stopped in the pipeline, worst first. */
    stuck: readonly Stall[] | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { stuck, freshness }: Props = $props();

  const listed = $derived(stuck !== undefined && stuck.length > 0);

  /**
   * What is wrong with it, and how long it has been that way.
   *
   * The service's own account of what is blocking it is carried through
   * unchanged where it gave one: a permission denial from an import log is worth
   * more than any reading of it.
   */
  function said(stall: Stall): string {
    const span = spanFor(stall.held_for);
    const state = wordOfStall(stall.stall);
    const blocking = stall.blocking ?? undefined;
    return blocking === undefined
      ? m.stuck_for({ stall: state, span })
      : m.stuck_because({ stall: state, blocking, span });
  }
</script>

<!--
  What has stopped, assessed across the download clients and the library
  managers together and ranked by cause. Twenty downloads a full disk stopped is
  one row here, not twenty.
-->
<Panel title={m.panel_attention()} {freshness} flush={listed}>
  {#if stuck !== undefined && listed}
    {#each stuck as one (one.name)}
      <Item
        state={stateOfStall(one.stall)}
        eyebrow={one.items === 1
          ? m.eyebrow_stuck()
          : m.stuck_several({ count: one.items })}
        title={one.name}
        prose={said(one)}
      />
    {/each}
  {:else if stuck !== undefined}
    <Value state="known" absent={m.figure_nothing_wrong()} />
  {:else}
    <Skeleton width="16rem" label={m.waiting_answer()} />
  {/if}
</Panel>
