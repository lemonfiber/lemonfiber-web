<script lang="ts">
  import StateMark from "./StateMark.svelte";
  import Value from "./Value.svelte";
  import type { State } from "../lib/state";

  interface Props {
    /** The program, or the place on disk, this box stands for. */
    name: string;
    /** The figure under the name, units and all. */
    figure: string;
    /**
     * How much the figure can be trusted. A place on disk runs nothing and has
     * no state of its own, so it is given none and carries no mark.
     */
    state?: State | undefined;
    /** Draws a thing the operator has not set up yet. */
    pending?: boolean | undefined;
  }

  let { name, figure, state, pending = false }: Props = $props();

  const trust: State = $derived(state ?? "known");
  const gone = $derived(state === "quiet");
</script>

<!--
  One box in the schematic: a program, or a place the files it fetches land in.

  The mark beside the name carries the trust, and a node whose source has gone
  quiet is drawn in the same broken line the quiet mark uses — so the state
  reads in shape as well as in colour, and reads to a screen reader as the
  mark's own word.

  Every figure in a node is set alike. The mark has already said how far it can
  be trusted, and a box this size has no room to say it twice, so `Value` is
  asked for the figure without the caption it would otherwise carry.
-->
<div class="node" class:quiet={gone} class:pending>
  <p class="nm">
    {#if state !== undefined}
      <StateMark {state} />
    {/if}
    <span class="word">{name}</span>
  </p>
  <p class="val"><Value state={trust} {figure} unmarked /></p>
</div>

<style>
  .node {
    /* The room a node standing on its own takes. A box that stacks them
       answers with its own. */
    min-width: var(--node-min-width, 132px);
    min-height: var(--node-min-height, 58px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    padding: var(--sp-2) var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    background: var(--paper);
    white-space: nowrap;
  }

  /* Gone quiet: the box is left open, in the broken line the quiet mark and
     the unreachable-source drawing are both built from. */
  .quiet {
    border-style: dashed;
    border-color: var(--faint);
    background: transparent;
  }

  /* Not a thing yet, so the box is neither closed nor filled in. The quiet
     comes off the border and the ink rather than off the whole box: fading a
     box fades the words in it, and a name at half strength is a name that
     cannot be read. */
  .pending {
    border-style: dashed;
    border-color: var(--line-soft);
    background: transparent;
  }

  .pending .nm {
    color: var(--muted);
    font-weight: 500;
  }

  .pending .val {
    --text: var(--faint);
  }

  .nm {
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--sp-tight);
    font-size: var(--text-control);
    font-weight: 600;
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  /* One ink for every figure in the diagram, whatever state it carries. */
  .val {
    --text: var(--muted);
    --faint: var(--muted);
    margin: 0;
    font-size: var(--text-note);
  }
</style>
