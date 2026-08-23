<script lang="ts">
  interface Props {
    /** The word as it reads in the sentence around it. */
    term: string;
    /** The word's own name, as the glossary gives it. */
    name: string;
    /** What it means, in a sentence a reader who has never met it can follow. */
    meaning: string;
    /** Whether this reader has opened it before. */
    read?: boolean | undefined;
  }

  let { term, name, meaning, read = false }: Props = $props();

  const popId = $props.id();
  let open = $state(false);
</script>

<!--
  A word the interface uses that a reader may not know. The underline says
  there is more to it, and pressing it says what.

  A button rather than a span that answers to hover: an explanation reachable
  only by pointer is one a keyboard reader never gets. Escape closes it and
  leaves focus on the word it came from, so there is nothing to escape twice.

  A term already read keeps its underline in the line colour. It still explains
  itself; it just stops asking to be pressed.
-->
<span class="wrap">
  <button
    type="button"
    class="term"
    class:read
    aria-expanded={open}
    aria-describedby={open ? popId : undefined}
    onclick={() => {
      open = !open;
    }}
    onkeydown={(event) => {
      if (event.key === "Escape") open = false;
    }}>{term}</button
  >
  {#if open}
    <span class="pop" id={popId} role="note">
      <span class="pop-name">{name}</span>
      <span class="pop-meaning">{meaning}</span>
    </span>
  {/if}
</span>

<style>
  .wrap {
    position: relative;
    display: inline;
  }

  .term {
    padding: 0 0 1px;
    border-bottom: 1.5px solid var(--fiber);
    font: inherit;
    color: inherit;
    background: none;
    cursor: help;
  }

  .term:hover {
    background: var(--warn-tint);
  }

  .read {
    border-bottom-color: var(--line);
  }

  .pop {
    position: absolute;
    z-index: 60;
    top: calc(100% + var(--sp-1));
    left: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    max-width: 20rem;
    padding: var(--sp-4);
    border: 1px solid var(--ink);
    border-radius: var(--r-md);
    background: var(--paper);
    box-shadow: 0 2px 5px var(--shadow);
    font-size: var(--text-prose);
    text-align: left;
    white-space: normal;
  }

  .pop-name {
    font-size: var(--text-item);
    font-weight: 600;
  }

  .pop-meaning {
    color: var(--muted);
  }
</style>
