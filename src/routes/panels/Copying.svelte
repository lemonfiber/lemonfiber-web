<script lang="ts">
  import Meter from "../../components/Meter.svelte";
  import Panel from "../../components/Panel.svelte";
  import Port from "../../components/Port.svelte";
  import {
    figuresOf,
    partOf,
    shareOf,
    startedOf,
    stateOf,
    titleOf,
    toneOf,
    type Running,
  } from "../../lib/copying";
  import type { Freshness } from "../../lib/freshness";

  interface Props {
    /** The backup or restore running now. */
    running: Running;
    /** When what it shows was last said. */
    freshness: Freshness;
  }

  let { running, freshness }: Props = $props();

  const title = $derived(titleOf(running));
  const figures = $derived(figuresOf(running));
</script>

<!--
  A backup or restore while it runs, as the stack says it: how much it has
  written of how much it will, the part it is writing, and whether it is
  working, slowed on purpose or stalled.

  The figures move every few seconds and are not announced each time: the bar
  carries them in words for a reader who reaches it. What is announced is a
  change of state or of part, which is the news.
-->
<Panel {title} {freshness}>
  <p class="figures">{figures}</p>
  <Meter part={shareOf(running)} label={title} said={figures} />
  <div class="told" role="status">
    <Port tone={toneOf(running)} />
    <div class="words">
      <p>{stateOf(running)}</p>
      <p>{partOf(running)}</p>
    </div>
  </div>
  <p class="started">{startedOf(running)}</p>
</Panel>

<style>
  .figures {
    margin: 0 0 var(--sp-2);
    font-size: var(--text-panel);
  }

  .told {
    display: flex;
    gap: var(--sp-2);
    align-items: flex-start;
    margin-top: var(--sp-3);
  }

  .words p {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-panel);
  }

  .started {
    margin: var(--sp-2) 0 0;
    font-size: var(--text-note);
    color: var(--muted);
  }
</style>
