<script lang="ts">
  import ShowAll from "../../components/ShowAll.svelte";
  import Said from "../../components/Said.svelte";
  import Panel from "../../components/Panel.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import { changeLines, type History } from "../../lib/history";
  import { Shortening } from "../../lib/shortening.svelte";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Everything lemonfiber changed, or why it could not be read. */
    history: Reading<History>;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { history, freshness }: Props = $props();

  /** Whether the list is shown whole. */
  const short = new Shortening();
</script>

<!--
  Everything lemonfiber changed on this machine, newest first: what each change
  did, the operation that made it, when, and how far it could be put back. How
  far back the record goes is said first, in lemonfiber's words, so a short
  record and a trimmed one read differently.
-->
<Panel title={m.panel_history()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.history_prose()} /></p>
    {#if history.ok}
      <p>{history.value.horizon}</p>
      {#if history.value.changes.length === 0}
        <p><Said text={m.history_none()} /></p>
      {/if}
    {/if}
    {#if !history.ok}
      <Value state="unknown" absent={history.problem.message} />
    {/if}
  </div>

  {#if history.ok && history.value.changes.length > 0}
    <ol class="changes" aria-label={m.history_said()}>
      {#each short.of(history.value.changes) as change, place (place)}
        <li>
          <h3>{change.did}</h3>
          <ul class="lines">
            {#each changeLines(change) as line, at (at)}
              <li><Said text={line} /></li>
            {/each}
          </ul>
        </li>
      {/each}
    </ol>
    <ShowAll items={history.value.changes} shortening={short} />
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

  .changes {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .changes > li {
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
</style>
