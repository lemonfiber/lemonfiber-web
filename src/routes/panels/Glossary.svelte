<script lang="ts">
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Switch from "../../components/Switch.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import { explainedHere } from "../../lib/explained.svelte";
  import { entryLines, type Vocabulary } from "../../lib/glossary";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Every word lemonfiber explains, or why they could not be read. */
    glossary: Reading<Vocabulary> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { glossary, freshness }: Props = $props();

  const explained = explainedHere();

  const words = $derived(glossary?.ok === true ? glossary.value : undefined);
  const problem = $derived(
    glossary?.ok === false ? glossary.problem.message : undefined,
  );
</script>

<!--
  Every word lemonfiber explains, in the order somebody meets them: each under
  the word itself, with what it is for and what it costs or gains, more where
  there is more, what other services call it, and the other forms lemonfiber
  writes it in. The explanations are the binary's own, served from the one
  table, and nothing here keeps a copy of them. Where the console explains
  terms where they stand, the switch here turns that off or on again, for this
  browser alone.
-->
<Panel title={m.panel_words()} {freshness} flush>
  <div class="scope">
    <p>{m.glossary_prose()}</p>
    {#if explained !== undefined}
      {@const shown = explained}
      <div class="switching">
        <p>{m.glossary_explain_prose()}</p>
        <Switch
          on={shown.on}
          label={m.glossary_explain()}
          onclick={() => {
            shown.on = !shown.on;
          }}
        />
      </div>
    {/if}
    {#if words === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if words === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {:else if words.words.length === 0}
      <p>{m.glossary_none()}</p>
    {/if}
  </div>

  {#if words !== undefined && words.words.length > 0}
    <ul class="entries" aria-label={m.glossary_said()}>
      {#each words.words as entry (entry.word)}
        <li>
          <h3>{entry.word}</h3>
          <ul class="lines">
            {#each entryLines(entry) as line, at (at)}
              <li><span class="word">{line}</span></li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<style>
  .scope {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--panel-pad) var(--sp-3);
  }

  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .switching {
    display: flex;
    gap: var(--sp-3);
    align-items: center;
    justify-content: space-between;
  }

  .entries {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entries > li {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  .lines {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .lines li {
    font-size: var(--text-prose);
    color: var(--muted);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
