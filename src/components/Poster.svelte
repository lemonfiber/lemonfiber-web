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
    /**
     * What pressing the poster does. Given, the name is a button that the whole
     * poster presses.
     */
    onopen?: (() => void) | undefined;
  }

  // The state prop is read as `standing`: a variable named `state` beside the
  // `$state` rune is read by the compiler as a store.
  let {
    title,
    artwork,
    state: standing,
    label,
    note,
    outline = false,
    onopen,
  }: Props = $props();

  /** Whether the picture failed to load, which draws the lettering instead. */
  let failed = $state(false);
</script>

<!--
  A thing somebody in the house asked for, at the size a wall of them reads at.

  Artwork is a picture of the title and nothing more, so it is never the name:
  the name is text under it, and the frame — whether it holds a picture or the
  lettering that stands in for one — is hidden from a screen reader, which
  would otherwise be read the same words twice.

  A poster that opens something is pressed anywhere on it, and is one button
  named by its title, so it is announced and reached once.

  A picture that fails to load is replaced by the lettering, so a wall whose
  pictures cannot be reached is still a wall of titles. It is asked for with no
  referrer, so the server behind it is not told which page asked.
-->
<div class="poster">
  {#if artwork === undefined || failed}
    <div class="art blank" class:outline aria-hidden="true">{title}</div>
  {:else}
    <img
      class="art"
      src={artwork}
      alt=""
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      onerror={() => {
        failed = true;
      }}
    />
  {/if}
  {#if onopen === undefined}
    <div class="t">{title}</div>
  {:else}
    <button type="button" class="t open" onclick={onopen}>{title}</button>
  {/if}
  {#if standing !== undefined}
    <StateTag state={standing} {label} wraps />
  {/if}
  {#if note !== undefined}
    <span class="sub">{note}</span>
  {/if}
</div>

<style>
  .poster {
    position: relative;
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

  /* The name is the button; the whole poster is where it is pressed. */
  /* The page undoes a button's own look once; what is left is its padding,
     and setting its words where the name's are. */
  .open {
    padding: 0;
    text-align: start;
  }

  .open::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: var(--r-sm);
  }

  .sub {
    max-width: 100%;
    white-space: normal;
    color: var(--faint);
    font-size: var(--text-note);
  }
</style>
