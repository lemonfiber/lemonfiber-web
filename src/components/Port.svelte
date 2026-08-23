<script lang="ts">
  import type { Tone } from "../lib/state";

  interface Props {
    /** How badly this wants the operator. */
    tone: Tone;
    /**
     * Announced to a screen reader; `severityWord` gives the default one.
     * Left out where text beside the port already says the same thing, which
     * makes the tile decorative.
     */
    label?: string | undefined;
  }

  let { tone, label }: Props = $props();
</script>

<!--
  The terminal from the mark: eight jacketed strands run out through the pith
  and end in a faceplate. A row terminates one of them, and how full the tile
  is says how much it wants you.

  The icon inside is a shape before it is a colour — a strand end, a note, a
  warning triangle — so the tile survives greyscale. The tile replaces a
  coloured bar down the left edge, which says severity in colour and nothing
  else.

  A calm port draws the strand seen end-on and claims nothing. A tick would
  say "checked, and true", which is more than calm knows: a figure nothing has
  ever measured is calm too, and it has been verified by no one.
-->
<span
  class="port"
  class:watch={tone === "watch"}
  class:alarm={tone === "alarm"}
>
  <svg class="ic" viewBox="0 0 24 24" aria-hidden="true">
    {#if tone === "calm"}
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
    {:else if tone === "watch"}
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8.2v.1" />
    {:else}
      <path d="M12 4.8 20.6 19.2H3.4Z" />
      <path d="M12 10.2v4M12 16.8v.1" />
    {/if}
  </svg>
  {#if label !== undefined}
    <span class="named">{label}</span>
  {/if}
</span>

<style>
  .port {
    width: var(--ctl-h);
    height: var(--ctl-h);
    flex: none;
    position: relative;
    display: grid;
    place-items: center;
    border: 1.5px solid var(--line);
    border-radius: var(--r-md);
    background: var(--pith);
    color: var(--muted);
  }

  /* The faceplate's bezel, dashed as the pith is in the mark. */
  .port::before {
    content: "";
    position: absolute;
    inset: var(--sp-1);
    border: 1px dashed currentColor;
    opacity: 0.22;
  }

  .ic {
    width: 17px;
    height: 17px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Filled, not outlined: the one that wants you is the only tile with weight,
     so a screen of calm ports reads as calm. */
  .watch {
    border-color: var(--fiber);
    background: var(--warn-tint);
    color: var(--fiber-deep);
  }

  .alarm {
    border-color: var(--alarm);
    background: var(--alarm);
    color: var(--paper);
  }

  .named {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
