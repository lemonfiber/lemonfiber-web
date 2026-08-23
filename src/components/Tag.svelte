<script lang="ts">
  import type { Snippet } from "svelte";
  import type { State, Tone } from "../lib/state";

  interface Props {
    /** The words on it. */
    label: string;
    /**
     * The ground it takes. Left out for a tag that carries no severity at all
     * — a plain label, which is a third of the tags on the screen.
     */
    tone?: Tone | undefined;
    /**
     * The state the tag stands for, recorded on the element. A tag naming a
     * thing rather than a state has none, and the two are set apart: a plain
     * ground can carry a state, and a tinted one can carry none.
     */
    state?: State | undefined;
    /** A mark sitting before the words. */
    children?: Snippet | undefined;
  }

  let { label, tone, state, children }: Props = $props();
</script>

<!--
  Squared, not a pill: it labels rather than badges. The mark carries the
  colour; the ground stays quiet, so eight working services read as calm and
  the one that wants you is the only thing with weight.

  A calm tag is drawn as a plain one for that reason. Colour says which state;
  weight says whether it wants you, and a working service wants nothing.
-->
<span
  class="tag"
  class:bare={tone === undefined}
  class:watch={tone === "watch"}
  class:alarm={tone === "alarm"}
  data-state={state}
>
  {#if children !== undefined}
    {@render children()}
  {/if}
  <span class="word">{label}</span>
</span>

<style>
  .word {
    /* Its own element so the interpolation is this node's only content: a lone
       interpolation compiles to a direct text node, one with siblings compiles
       to a `?? ''` fallback that is unreachable and so uncoverable. */
    display: contents;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-tight);
    padding: 2px 7px;
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    background: var(--pith);
    color: var(--muted);
    font-size: var(--text-tag);
    font-weight: 500;
    white-space: nowrap;
  }

  /* No severity behind it, so it takes no ground either: it names a thing, and
     a filled ground would lend a plain label the weight of a state. */
  .bare {
    background: transparent;
  }

  .watch {
    border-color: var(--fiber);
    color: var(--fiber-deep);
    background: var(--warn-tint);
  }

  .alarm {
    border-color: var(--alarm);
    color: var(--alarm);
    background: var(--alarm-tint);
  }
</style>
