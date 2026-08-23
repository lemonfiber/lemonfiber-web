<script lang="ts">
  import type { Snippet } from "svelte";
  import Port from "./Port.svelte";
  import { severityWord, type Tone } from "../lib/state";

  interface Props {
    /** How badly this wants the operator. */
    tone: Tone;
    /** What happened, in one clause. */
    lead: string;
    /** What it means for everything below it. */
    prose: string;
    /** Buttons. Omitted where there is nothing to press. */
    actions?: Snippet | undefined;
  }

  let { tone, lead, prose, actions }: Props = $props();

  const urgent = $derived(tone === "alarm");
  const named = $derived(severityWord(tone));
</script>

<!--
  What the whole screen has to be told, rather than one panel. A panel stamps
  its own source; a banner says the thing every panel below it depends on.

  It terminates a strand like a row does, so the severities read the same
  everywhere. The port is named here rather than left decorative: a banner has
  no eyebrow beside it saying what the tile means.

  A calm or watchful banner is announced when the reader next pauses; one that
  wants them now interrupts.
-->
<div
  class="banner"
  class:watch={tone === "watch"}
  class:alarm={urgent}
  role={urgent ? "alert" : "status"}
>
  <Port {tone} label={named} />
  <p class="says">
    <strong class="lead">{lead}</strong>
    <span class="rest">{prose}</span>
  </p>
  {#if actions !== undefined}
    <div class="acts">{@render actions()}</div>
  {/if}
</div>

<style>
  .rest {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  .banner {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--panel-pad);
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    background: var(--pith);
    font-size: var(--text-prose);
  }

  .watch {
    border-color: var(--fiber);
    background: var(--warn-tint);
  }

  .alarm {
    border-color: var(--alarm);
    background: var(--alarm-tint);
  }

  /* A sentence is set in reading ink whatever it says. The severity is the
     ground, the border and the port; amber words on an amber tint reach 4.3:1,
     which is under AA. */
  .says {
    flex: 1 1 24ch;
    min-width: 0;
    margin: 0;
    color: var(--text);
  }

  .lead {
    margin-right: var(--sp-1);
  }

  .acts {
    margin-left: auto;
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
