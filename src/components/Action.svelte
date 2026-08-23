<script lang="ts">
  import type { Weight } from "../lib/weight";

  interface Props {
    /** The words on it, and the name it is announced by. */
    label: string;
    /** `firm` is the one thing being asked for; everything else is `quiet`. */
    weight?: Weight | undefined;
    /** What pressing it does. */
    onclick?: (() => void) | undefined;
  }

  let { label, weight = "quiet", onclick }: Props = $props();
</script>

<!--
  Two weights and no third. A quiet control is outlined and takes the ground it
  sits on; a firm one is filled in lemon, and a screen has one of them.

  A button, never a styled link or a div: it is reachable by tab, pressed by
  space and enter, and named by its own words, none of which a rebuilt one
  gets for free.

  `type` is fixed rather than offered. A control inside a form defaults to
  submitting it, which is a second thing to press by accident.
-->
<button class="act" class:firm={weight === "firm"} type="button" {onclick}>
  <span class="word">{label}</span>
</button>

<style>
  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  .act {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--ctl-h);
    padding: 0 var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    background: var(--paper);
    color: var(--muted);
    font: inherit;
    font-size: var(--text-control);
    white-space: nowrap;
    cursor: pointer;
  }

  .act:hover {
    border-color: var(--faint);
    color: var(--text);
  }

  /* Lemon is lemon in both themes, so what sits on it does not follow the ink
     that flips with them. */
  .firm {
    padding: 0 var(--sp-4);
    border-color: var(--fiber-deep);
    background: var(--lemon);
    color: var(--on-lemon);
    font-size: var(--text-prose);
    font-weight: 600;
  }

  .firm:hover {
    background: var(--lemon-bright);
  }
</style>
