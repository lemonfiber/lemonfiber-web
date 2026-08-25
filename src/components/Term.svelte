<script lang="ts">
  import Skeleton from "./Skeleton.svelte";
  import type { Explaining } from "../api/explaining";
  import type { Word } from "../lib/wire";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** The word as it reads in the sentence around it. */
    term: string;
    /**
     * The word as the one table files it, which is what is asked about.
     *
     * Not a message. It is what the binary's table is keyed by, and a translated
     * key finds nothing.
     */
    word: string;
    /** How this surface asks what a word means. */
    explain: Explaining;
    /** Whether this reader has opened it before. */
    read?: boolean | undefined;
  }

  let { term, word, explain, read = false }: Props = $props();

  const popId = $props.id();
  const waiting = m.waiting_answer();
  const unanswered = m.word_unanswered();

  let open = $state(false);
  let asking = $state(false);
  let said = $state<Word | undefined>(undefined);

  /**
   * Ask what the word means, and keep what came back.
   */
  async function ask(): Promise<void> {
    asking = true;
    const answer = await explain(word);
    asking = false;
    if (answer.ok) said = answer.value;
  }

  /**
   * Open or close the explanation, asking for it the first time it is wanted.
   */
  function press(): void {
    open = !open;
    if (open && said === undefined) void ask();
  }
</script>

<!--
  A word the interface uses that a reader may not know. The underline says
  there is more to it, and pressing it says what.

  What it says is the binary's answer rather than this surface's own words: the
  vocabulary is one table, served, and a copy of an entry here would be a second
  explanation of a word to keep in step with the first.

  A button rather than a span that answers to hover: an explanation reachable
  only by pointer is one a keyboard reader never gets. Escape closes it and
  leaves focus on the word it came from, so there is nothing to escape twice.

  Nothing is asked until a reader asks. The answer takes the place a bar holds
  until it arrives, and an answer that never arrives is said plainly — a word
  that opens onto nothing is worse than one that was never underlined.

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
    onclick={press}
    onkeydown={(event) => {
      if (event.key === "Escape") open = false;
    }}>{term}</button
  >
  {#if open}
    <span class="pop" id={popId} role="note">
      {#if said !== undefined}
        <span class="pop-name">{said.word}</span>
        <span class="pop-meaning">{said.short}</span>
      {:else if asking}
        <Skeleton width="14rem" label={waiting} />
      {:else}
        <span class="pop-meaning">{unanswered}</span>
      {/if}
    </span>
  {/if}
</span>

<style>
  .wrap {
    position: relative;
    display: inline;
  }

  .term {
    padding: 0 0 0.0625rem;
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
