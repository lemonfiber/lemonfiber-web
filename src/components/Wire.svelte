<script lang="ts">
  interface Props {
    /**
     * What the connector means, read where the arrow is drawn. Left out where
     * the two things it joins already read as one sentence, which makes the
     * arrow decorative.
     */
    label?: string | undefined;
    /** Draws a connector nothing is moving along. */
    quiet?: boolean | undefined;
  }

  let { label, quiet = false }: Props = $props();
</script>

<!--
  The connector between two boxes. It is drawn on a 48 by 12 grid rather than
  the 24 grid the interface icons share: it is this diagram's own part, not a
  drawing that could sit beside a label.

  The arrow is the direction drawn. The word is the same direction written, and
  it is read where the arrow sits, between the two things it joins — so the
  diagram reads as a sentence rather than as a pile of names. A reader who is
  given the arrow and the word both is given the fact twice, so the drawing
  itself stays out of the reading.
-->
<span class="wire" class:quiet>
  <svg class="arrow" viewBox="0 0 48 12" aria-hidden="true">
    <path d="M0 6H34" stroke-width="2.5" stroke-linecap="butt" />
    <path d="M33 1.2 43 6 33 10.8Z" fill="currentColor" stroke="none" />
  </svg>
  {#if label !== undefined}
    <span class="said">{label}</span>
  {/if}
</span>

<style>
  /* The wires are fibre, so they are drawn in it. The negative margin pulls
     the arrow into the gap between the boxes it joins. */
  .wire {
    position: relative;
    flex: none;
    align-self: center;
    width: 2.75rem;
    margin: 0 calc(var(--sp-2) * -1);
    color: var(--fiber);
  }

  .arrow {
    display: block;
    width: 100%;
    height: 0.75rem;
    fill: none;
    stroke: currentColor;
  }

  .quiet {
    color: var(--faint);
  }

  /* A broken line for a route nothing is taking, as the quiet mark is broken
     and the quiet node's border is. */
  .quiet .arrow {
    stroke-dasharray: 3 3.5;
  }
</style>
