<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** What the setting is called. */
    title: string;
    /** What it does, and what changing it changes. */
    prose: string;
    /** The one thing that sets it: a switch, a button, a tag, a field. */
    control: Snippet;
  }

  let { title, prose, control }: Props = $props();
</script>

<!--
  One setting to a line: what it is called, what it does, and the thing that
  sets it.

  The control is a snippet rather than a named kind. Across the settings screens
  the right-hand side is a switch, a button, a tag or a field, in no fixed
  proportion, and a row that had to know which of those it was holding would
  grow a branch per control and be no better for any of them.

  Every row says what the setting does, not only what it is called. "Stop
  everyone when the disk is nearly full" is a title an operator can still be
  wrong about; the line under it is where the 200 GB lives.

  The heading is an h4 — a row sits inside a subview, whose title is the h3.
-->
<div class="setrow">
  <div>
    <h4>{title}</h4>
    <p>{prose}</p>
  </div>
  <div class="control">{@render control()}</div>
</div>

<style>
  .setrow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-5);
    align-items: center;
    padding: var(--sp-4) 0;
    border-bottom: 1px solid var(--line-soft);
  }

  .setrow:last-child {
    border-bottom: 0;
  }

  h4 {
    margin: 0 0 0.125rem;
    font-size: var(--text-panel);
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: var(--text-control);
    color: var(--muted);
    max-width: 64ch;
  }

  /* A row, so a control that arrives as several parts — a field and the unit
     it is counted in — stays one cell of the grid rather than two. */
  .control {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }
</style>
