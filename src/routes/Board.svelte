<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** The panels, in the order they are read. */
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<!--
  The column a screen's panels stand in.

  Every screen is a stack of panels down one column with one gap between them,
  so the column is one shape rather than one per screen — and a screen drawn on
  its own in a story stands the same way it stands inside the chrome.

  A panel is allowed to be narrower than the widest thing inside it. What does
  not fit scrolls or wraps inside its own frame — a table inside its wrapper, a
  picture inside its own, a log line inside its list — rather than taking the
  page sideways. Without this a grid track is floored at its contents, and one
  wide picture sets the width of the screen.
-->
<div class="board">
  {@render children()}
</div>

<style>
  .board {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-4);
    align-content: start;
  }

  .board > :global(*) {
    min-width: 0;
  }
</style>
