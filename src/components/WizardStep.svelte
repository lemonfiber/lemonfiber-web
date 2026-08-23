<script lang="ts">
  import Icon from "./Icon.svelte";
  import type { Standing } from "../lib/steps";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** Which number this step is in the run, counting from one. */
    position: number;
    /** How many steps the run has. */
    total: number;
    /** What the step is called. */
    title: string;
    /** What it settled, or what it will ask for. */
    detail: string;
    /** Where it stands: behind you, being done, or still to come. */
    standing: Standing;
  }

  let { position, total, title, detail, standing }: Props = $props();

  const done = $derived(standing === "done");
  const now = $derived(standing === "now");
  const said = $derived(m.step_of({ position, total }));
</script>

<!--
  One step of a setup, on the rail beside the step being done.

  Three standings and no fourth. The tick says done and the ring says now, so
  a step's standing survives greyscale and a printed page.

  The numeral is drawn rather than announced, and the step's place in the run
  is announced rather than drawn: a reader hearing "4" learns nothing it does
  not already know from "step 4 of 7", and hearing both is the same fact
  twice. Which one is being done is carried by `aria-current`, which is where
  a screen reader looks for it.

  The line down to the next step is drawn by every step but the last, and a
  step knows it is last only by being the last of its siblings.
-->
<div class="vstep" class:done class:now aria-current={now ? "step" : undefined}>
  <span class="said">{said}</span>
  <span class="n">
    {#if done}
      <Icon name="tick" size="small" label={m.step_done()} />
    {:else}
      <span aria-hidden="true">{position}</span>
    {/if}
  </span>
  <span class="body">
    <span class="t">{title}</span>
    <span class="d">{detail}</span>
  </span>
</div>

<style>
  .vstep {
    position: relative;
    display: grid;
    grid-template-columns: 1.5rem 1fr;
    gap: var(--sp-3);
    align-items: start;
    padding: 0 0 var(--sp-4);
  }

  .vstep:last-child {
    padding-bottom: 0;
  }

  /* The line from this step's number down to the next one's, drawn as a border
     at the width the ring around each number takes. An empty box given only a
     left edge is as wide as that border and no wider. */
  .vstep::before {
    content: "";
    position: absolute;
    left: 0.6875rem;
    top: 1.6875rem;
    bottom: 0.125rem;
    border-left: 1.5px solid var(--line);
  }

  .vstep:last-child::before {
    display: none;
  }

  .vstep.done::before {
    border-color: var(--fiber);
  }

  .n {
    display: grid;
    place-items: center;
    width: 1.5rem;
    height: 1.5rem;
    border: 1.5px solid var(--line);
    border-radius: var(--r-md);
    background: var(--paper);
    color: var(--faint);
    font-family: var(--mono);
    font-size: var(--text-tag);
  }

  /* Amber in both palettes, so the tick on it takes the ink that does not
     flip with them. */
  .vstep.done .n {
    border-color: var(--fiber);
    background: var(--fiber);
    color: var(--on-lemon);
  }

  /* Lemon is lemon in both palettes, so the numeral and the ring around it
     take that same ink. */
  .vstep.now .n {
    border-width: 2px;
    border-color: var(--on-lemon);
    background: var(--lemon);
    color: var(--on-lemon);
  }

  .body {
    min-width: 0;
  }

  .t {
    display: block;
    padding-top: 0.1875rem;
    font-size: var(--text-panel);
    font-weight: 600;
    color: var(--faint);
  }

  .vstep.done .t {
    font-weight: 500;
    color: var(--muted);
  }

  .vstep.now .t {
    color: var(--text);
  }

  .d {
    display: block;
    margin-top: 0.0625rem;
    font-size: var(--text-note);
    color: var(--faint);
  }
</style>
