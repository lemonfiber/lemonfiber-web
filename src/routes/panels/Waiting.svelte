<script lang="ts">
  import Enclosure from "../../components/Enclosure.svelte";
  import Node from "../../components/Node.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import { tally } from "../../lib/figures";
  import type { Freshness } from "../../lib/freshness";
  import { reasonOf, type Queues } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The per-service queues, as the stream last read them. */
    queues: Queues | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { queues, freshness }: Props = $props();

  const queued = $derived(queues?.panel === "ready" ? queues.data : undefined);
  const reason = $derived(reasonOf(queues));
</script>

<!--
  How much each service is holding, as boxes in one line.

  A queue is a count and runs nothing, so its box carries no mark: what is stuck
  in it is ranked by cause on the panel that says what needs the operator, and a
  second grading here would be the same fact competing with itself.
-->
{#snippet unfilled()}
  <Value state="unknown" absent={reason} />
{/snippet}

<Panel
  title={m.panel_waiting_in_line()}
  {freshness}
  dead={reason === undefined ? undefined : unfilled}
>
  {#if queued === undefined}
    <Skeleton width="10rem" label={m.waiting_answer()} />
  {:else if queued.length === 0}
    <Value state="unknown" absent={m.waiting_nothing()} />
  {:else}
    <Enclosure label={m.head_waiting()}>
      {#each queued as one (one.service)}
        <Node name={one.service} figure={tally(one.depth)} />
      {/each}
    </Enclosure>
  {/if}
</Panel>
