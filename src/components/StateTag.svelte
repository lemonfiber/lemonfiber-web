<script lang="ts">
  import StateMark from "./StateMark.svelte";
  import { type State, toneFor, wordFor } from "../lib/state";

  interface Props {
    state: State;
    /** Overrides the state's own word, for a tag naming a thing rather than a state. */
    label?: string | undefined;
  }

  let { state, label }: Props = $props();

  const tone = $derived(toneFor(state));
  const text: string = $derived(label ?? wordFor(state));
</script>

<!--
  Squared, not a pill: it labels rather than badges. The mark carries the
  colour; the ground stays quiet, so eight working services read as calm and
  the one that wants you is the only thing with weight.
-->
<span
  class="tag"
  class:watch={tone === "watch"}
  class:alarm={tone === "alarm"}
  data-state={state}
>
  <StateMark {state} {label} />
  <span class="word">{text}</span>
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
    gap: 6px;
    padding: 2px 7px;
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    background: var(--pith);
    color: var(--muted);
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
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
