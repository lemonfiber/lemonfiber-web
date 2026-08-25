<script lang="ts">
  import Value from "./Value.svelte";
  import { showingFor, type State } from "../lib/state";

  interface Props {
    /** How much the figure can be trusted. */
    state: State;
    /** The figure as it should read. */
    figure?: string | undefined;
    /** Stands in for the figure when there is none. */
    absent?: string | undefined;
    /** What the figure is, above it. */
    eyebrow?: string | undefined;
    /** The unit the figure is measured in, inside it at half its size. */
    unit?: string | undefined;
    /** The whole the figure is a part of, inside it and faint. */
    outOf?: string | undefined;
    /** What the figure is measured against, beside it on the same baseline. */
    beside?: string | undefined;
    /** What the figure means, under it. */
    caption?: string | undefined;
    /** Sets the figure in the ink of a thing that wants the operator. */
    alarm?: boolean | undefined;
  }

  let {
    state,
    figure,
    absent,
    eyebrow,
    unit,
    outOf,
    beside,
    caption,
    alarm = false,
  }: Props = $props();

  const numeral = $derived(
    figure !== undefined && showingFor(state) !== "words",
  );
</script>

<!--
  One figure, given a panel to itself. Size and emphasis are the whole of what
  this adds: `Value` inside it owns how much the figure claims, so a figure
  nobody has measured is set in words here as it is everywhere else, rather
  than as a large numeral that would look measured.

  A unit and a whole only ride along beside a numeral. Set after "not known"
  they would read as a measurement of it.
-->
<div class="block">
  {#if eyebrow !== undefined}
    <p class="eyebrow">{eyebrow}</p>
  {/if}
  <div class="line">
    <span class="fig" class:alarm>
      <Value {state} {figure} {absent} />
      {#if numeral}
        {#if outOf !== undefined}
          <span class="of">{outOf}</span>
        {/if}
        {#if unit !== undefined}
          <span class="unit">{unit}</span>
        {/if}
      {/if}
    </span>
    {#if beside !== undefined}
      <span class="beside">{beside}</span>
    {/if}
  </div>
  {#if caption !== undefined}
    <p class="caption">{caption}</p>
  {/if}
</div>

<style>
  .block {
    display: grid;
    gap: var(--sp-2);
    justify-items: start;
  }

  .eyebrow {
    margin: 0;
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--faint);
  }

  /* The figure and what it is measured against read as one line, and drop to
     two where the column is narrower than the two of them. */
  .line {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sp-3);
  }

  .fig {
    font-family: var(--mono);
    font-size: var(--text-figure);
    font-weight: 500;
    letter-spacing: -0.03em;
  }

  /* The figure's ink is --text, which is what `Value` sets a measured figure
     in. A count that wants the operator names a different ink for the block,
     and the figure follows it. */
  .alarm {
    --text: var(--alarm);
  }

  /* The whole, not the part: it is what the figure is measured against, so it
     carries less ink at the same size. */
  .of {
    color: var(--faint);
  }

  /* One character of the figure's own face, which is the gap a space leaves. */
  .unit {
    margin-left: 1ch;
    font-size: var(--text-unit);
    color: var(--muted);
  }

  .beside {
    color: var(--muted);
  }

  .caption {
    margin: 0;
    color: var(--faint);
    font-size: var(--text-note);
  }
</style>
