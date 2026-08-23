<script lang="ts">
  import { showingFor, type State } from "../lib/state";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** How much the figure can be trusted. */
    state: State;
    /** The figure as it should read, units and all. */
    figure?: string | undefined;
    /** Stands in for the figure when there is none. */
    absent?: string | undefined;
    /**
     * Drops the caption that marks a figure as the last one given, for a place
     * that already says as much beside the figure and has no room to say it
     * twice.
     */
    unmarked?: boolean | undefined;
  }

  let { state, figure, absent, unmarked = false }: Props = $props();

  const showing = $derived(figure === undefined ? "words" : showingFor(state));
  const said = $derived(absent ?? m.value_not_known());
  const lastKnown = m.value_last_known();
</script>

<!--
  Three renderings, so that a figure never claims more than it is.

  A figure with no measurement behind it is set in words, in the interface face
  and in italic — never in the figure face, and never as a numeral. "0 B/s" and
  "not known" mean opposite things, and a reader glancing at a column of
  numerals must not be able to mistake one for the other.

  The caption is what says a dimmed figure is the last one given. It is dropped
  only where the same thing is said beside the figure, which is the caller's
  claim to make rather than this one's.
-->
{#if showing === "words"}
  <em class="absent">{said}</em>
{:else if showing === "dim"}
  <span class="dim">
    <span class="figure">{figure}</span>
    {#if !unmarked}
      <span class="marker">{lastKnown}</span>
    {/if}
  </span>
{:else}
  <span class="ink figure">{figure}</span>
{/if}

<style>
  .figure {
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .ink {
    color: var(--text);
  }

  /* Dimmed, not greyed out: the figure is still the best answer there is. */
  .dim {
    display: inline-flex;
    align-items: baseline;
    gap: var(--sp-tight);
    color: var(--faint);
  }

  /* The marker is a caption on the figure, so it never wraps away from it. */
  .marker {
    font-size: var(--text-value);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    padding: 0 0.1875rem;
    white-space: nowrap;
    color: var(--faint);
  }

  .absent {
    color: var(--faint);
    font-family: var(--sans);
    font-style: italic;
    font-size: 0.95em;
  }
</style>
