<script lang="ts">
  import Icon from "./Icon.svelte";

  interface Props {
    /** Whether lines of this kind are being shown. */
    on: boolean;
    /** What it selects, in the words the log itself uses. */
    label: string;
    /** How many lines it holds, as it should read. Left out where nothing counts them. */
    count?: string | undefined;
    /** What pressing it asks for. */
    onclick?: (() => void) | undefined;
  }

  let { on, label, count, onclick }: Props = $props();
</script>

<!--
  One kind of line, kept or dropped. A filter is a column of these, and the
  count on the right says what taking one away would cost.

  It is controlled, as the two-position switch is: it shows the position it was
  told to show and asks for the other one. The screen that owns the filter is
  the one that finds out whether the change took.

  A button with `aria-pressed`, never a bare box: the position is announced in
  the one place a screen reader looks for it, and the tick says it again by
  being there or not, which survives greyscale.

  `type` is fixed rather than offered. A control inside a form defaults to
  submitting it, which is a second thing to press by accident.
-->
<button class="checkline" type="button" aria-pressed={on} {onclick}>
  <span class="box">
    {#if on}
      <Icon name="tick" />
    {/if}
  </span>
  <span class="word">{label}</span>
  {#if count !== undefined}
    <span class="n">{count}</span>
  {/if}
</button>

<style>
  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  .checkline {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    padding: var(--sp-1) 0;
    color: var(--muted);
    font-size: var(--text-prose);
    text-align: left;
  }

  /* Full ink for what is being shown, so the column reads as a list of what
     is in rather than a list of what exists. */
  .checkline[aria-pressed="true"] {
    color: var(--text);
  }

  .box {
    width: 0.9375rem;
    height: 0.9375rem;
    flex: none;
    display: grid;
    place-items: center;
    border: 1.5px solid var(--faint);
    border-radius: var(--r-sm);
  }

  /* Fiber is a colour in both themes rather than an ink that flips with them,
     so the tick takes the ground each theme draws its surfaces on: pale on
     the light fiber, dark on the brighter one the dark theme uses. */
  .checkline[aria-pressed="true"] .box {
    background: var(--fiber);
    border-color: var(--fiber-deep);
    color: var(--paper);
  }

  /* Smaller than either drawing size, and stroked heavier to hold up at it. */
  .box :global(.ic) {
    width: 0.6875rem;
    height: 0.6875rem;
    stroke-width: 3;
  }

  .n {
    margin-left: auto;
    font-family: var(--mono);
    font-size: var(--text-tag);
    color: var(--faint);
  }
</style>
