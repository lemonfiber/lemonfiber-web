<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import {
    cataloguedLines,
    shownOf,
    type PluginCatalogue,
  } from "../../lib/catalogued";
  import type { Plugger } from "../../lib/plugging";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the catalogue offers, or why it could not be read. */
    offering: Reading<PluginCatalogue>;
    /** What installing one asks for, where this page may act. */
    plugger?: Plugger | undefined;
  }

  let { offering, plugger }: Props = $props();

  const titleId = $props.id();

  const shown = $derived(shownOf(offering));
</script>

<!--
  Every plugin the verified catalogue offers, each by its name with what it
  does, the version the catalogue reviewed, what of it is installed here and
  what the household is without it. Installing one hands its name to the
  install reading, so it is read first as any install is. Where asking the
  catalogue is switched off this says so with the setting that switches it
  on; where the index could not be read it says lemonfiber's sentence and
  lists nothing.
-->
<section class="catalogue" aria-labelledby={titleId}>
  <h3 id={titleId}>{m.plug_catalogue_title()}</h3>
  <p class="prose"><Said text={m.plug_catalogue_prose()} /></p>
  {#if shown.said !== undefined}
    <p class="prose"><Said text={shown.said} /></p>
  {/if}

  {#if shown.entries.length > 0}
    <ul class="entries" aria-label={m.plug_catalogue_said()}>
      {#each shown.entries as entry (entry.id)}
        <li>
          <h4>{entry.name}</h4>
          <ul class="lines">
            {#each cataloguedLines(entry) as line, at (at)}
              <li><Said text={line} /></li>
            {/each}
          </ul>
          {#if plugger !== undefined}
            {@const acting = plugger}
            <div class="acts">
              <Action
                label={m.action_plug_catalogue_install({ name: entry.name })}
                off={acting.busy}
                onclick={() => {
                  acting.onask({ doing: "plugin-install", source: entry.id });
                }}
              />
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .catalogue {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3,
  h4 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  h4 {
    font-weight: 500;
  }

  .entries,
  .lines {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entries {
    gap: var(--sp-3);
  }

  .entries > li {
    display: grid;
    gap: var(--sp-1);
  }

  .lines li,
  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
