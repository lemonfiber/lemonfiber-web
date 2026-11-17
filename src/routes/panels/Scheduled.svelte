<script lang="ts">
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import type { Freshness } from "../../lib/freshness";
  import {
    linesOfScheduled,
    saidOfScheduled,
    stateOfScheduled,
    wordOfScheduled,
    type Scheduled,
  } from "../../lib/scheduled";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Every run-and-exit service, with how its last run ended. */
    scheduled: readonly Scheduled[];
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { scheduled, freshness }: Props = $props();
</script>

<!--
  The services that run and exit on a schedule, each with how its last run
  ended, and the last lines it wrote where that run failed.
-->
<Panel title={m.panel_scheduled()} {freshness} flush>
  {#each scheduled as one (one.id)}
    {@const lines = linesOfScheduled(one)}
    <Item
      state={stateOfScheduled(one)}
      eyebrow={wordOfScheduled(one)}
      title={one.name}
      prose={saidOfScheduled(one)}
      lines={lines === undefined
        ? undefined
        : { named: m.scheduled_lines(), said: lines }}
    />
  {/each}
</Panel>
