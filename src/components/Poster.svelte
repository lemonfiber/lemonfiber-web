<script lang="ts">
  import StateTag from "./StateTag.svelte";
  import type { State } from "../lib/state";

  interface Props {
    /** The thing's name, under the picture. */
    title: string;
    /** The picture. The title stands in for it where there is none. */
    artwork?: string | undefined;
    /** How the thing is doing, as a tag under the title. */
    state?: State | undefined;
    /** The tag's own words in place of the state's. */
    label?: string | undefined;
    /** A caption under the title, where there is no tag. */
    note?: string | undefined;
    /** Draws the frame as an outline, for a poster standing for nothing yet. */
    outline?: boolean | undefined;
  }

  let { title, artwork, state, label, note, outline = false }: Props = $props();
</script>

<!--
  A thing somebody in the house asked for, at the size a wall of them reads at.

  Artwork is a picture of the title and nothing more, so it is never the name:
  the name is text under it, and the frame — whether it holds a picture or the
  lettering that stands in for one — is hidden from a screen reader, which
  would otherwise be read the same words twice.
-->
<div class="poster">
  {#if artwork === undefined}
    <div class="art blank" class:outline aria-hidden="true">{title}</div>
  {:else}
    <img class="art" src={artwork} alt="" />
  {/if}
  <div class="t">{title}</div>
  {#if state !== undefined}
    <StateTag {state} {label} wraps />
  {/if}
  {#if note !== undefined}
    <span class="sub">{note}</span>
  {/if}
</div>

<style>
  .poster {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
    align-content: start;
  }

  .art {
    aspect-ratio: 2/3;
    border-radius: var(--r-sm);
    border: 1px solid var(--ink);
    background: var(--pith);
  }

  /* The lettering that stands in for a picture, which is what a wall of these
     shows until artwork has been fetched. */
  .blank {
    display: grid;
    place-items: center;
    padding: var(--sp-2);
    color: var(--muted);
    font-size: var(--text-legend);
    font-weight: 600;
    text-align: center;
  }

  /* Not a thing yet, so the frame is not closed. */
  .outline {
    border-style: dashed;
  }

  img.art {
    width: 100%;
    object-fit: cover;
  }

  .t {
    font-size: var(--text-prose);
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  .sub {
    max-width: 100%;
    white-space: normal;
    color: var(--faint);
    font-size: var(--text-note);
  }
</style>
