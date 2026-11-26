<script lang="ts">
  import Meter from "../../components/Meter.svelte";
  import Said from "../../components/Said.svelte";
  import { unfinishedLine, type Interrupted } from "../../lib/inflight";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the act this question asks about would interrupt. */
    told: Interrupted;
  }

  let { told }: Props = $props();

  const headingId = $props.id();
</script>

<!--
  What an act would interrupt, drawn inside its question above the yes: each
  download still coming down, how far along it is as a bar, and the kind of
  client holding it in words. Where the stack names nothing, nothing is drawn.
-->
{#if told.said !== undefined}
  <section class="unfinished" aria-labelledby={headingId}>
    <h4 id={headingId}>{m.inflight_heading()}</h4>
    <p class="prose"><Said text={told.said} /></p>
    {#if told.downloads.length > 0}
      <ul class="downloads">
        {#each told.downloads as download, at (at)}
          {@const line = unfinishedLine(download)}
          <li>
            <span class="line"><Said text={line} /></span>
            <Meter
              part={download.progress / 100}
              label={download.name}
              said={line}
            />
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}

<style>
  .unfinished {
    display: grid;
    gap: var(--sp-2);
    margin-top: var(--sp-3);
    overflow-wrap: anywhere;
  }

  h4 {
    margin: 0;
    font-size: var(--text-prose);
    font-weight: 600;
  }

  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .downloads {
    display: grid;
    gap: var(--sp-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    gap: var(--sp-tight);
    font-size: var(--text-prose);
  }

  .line {
    display: contents;
  }
</style>
