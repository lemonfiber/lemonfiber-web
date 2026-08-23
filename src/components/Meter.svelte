<script lang="ts">
  import { showingFor, type State } from "../lib/state";

  interface Props {
    /** How much of it is done, from 0 to 1. */
    part: number;
    /** What is being measured; the name the bar is announced by. */
    label: string;
    /** How much the figure behind the bar can be trusted. */
    state?: State | undefined;
  }

  let { part, label, state = "known" }: Props = $props();

  // A share outside its own bounds would draw a bar past its track and read to
  // a screen reader as more than all of something.
  const filled = $derived(Math.min(1, Math.max(0, part)));
  const percent = $derived(Math.round(filled * 100));
  const width = $derived(`${String(percent)}%`);
  const current = $derived(showingFor(state) === "ink");
</script>

<!--
  How far along, as a length. The length is the whole of what it says: a bar
  that stops short says so at any size, in any colour, and with none.

  A bar drawn from a figure nobody is measuring now loses its amber, and the
  figure beside it is what says why — the bar repeats the state rather than
  carrying it on its own.
-->
<div
  class="meter"
  role="progressbar"
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={percent}
>
  <span class="fill" class:dim={!current} style:width></span>
</div>

<style>
  .meter {
    height: 5px;
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    background: var(--canvas);
    overflow: hidden;
  }

  /* The wires in the schematic are fibre, and so is this: it is the same
     material moving. */
  .fill {
    display: block;
    height: 100%;
    background: var(--fiber);
  }

  .dim {
    background: var(--faint);
  }
</style>
