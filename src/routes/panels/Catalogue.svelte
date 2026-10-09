<script lang="ts">
  import ShowAll from "../../components/ShowAll.svelte";
  import Said from "../../components/Said.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import {
    droppedLine,
    serviceLines,
    type Catalogue,
    type Provenance,
  } from "../../lib/catalogue";
  import type { Freshness } from "../../lib/freshness";
  import { SHORT_DETAILED, Shortening } from "../../lib/shortening.svelte";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What each service is for, or why it could not be read. */
    catalogue: Reading<Catalogue> | undefined;
    /** Where each service comes from, or why it could not be read. */
    provenance: Reading<Provenance> | undefined;
    /** When this panel's sources last answered. */
    freshness: Freshness;
  }

  let { catalogue, provenance, freshness }: Props = $props();

  const droppedId = $props.id();

  const held = $derived(catalogue?.ok === true ? catalogue.value : undefined);
  const problem = $derived(
    catalogue?.ok === false ? catalogue.problem.message : undefined,
  );
  const origins = $derived(
    provenance?.ok === true ? provenance.value : undefined,
  );
  const originsProblem = $derived(
    provenance?.ok === false ? provenance.problem.message : undefined,
  );

  /** Whether the list is shown whole. */
  const short = new Shortening(SHORT_DETAILED);
</script>

<!--
  Every service the stack holds, whether or not it runs: what it does, what
  going without it costs, how much its absence matters, and where it comes
  from, read together by the id the stack declares each under. Under them, the
  services the stack has dropped. Each of the two readings says for itself why
  it could not be read.
-->
<Panel title={m.panel_catalogue()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.catalogue_prose()} /></p>
    {#if held === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if held === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {:else if held.services.length === 0}
      <p><Said text={m.catalogue_none()} /></p>
    {/if}
    {#if originsProblem !== undefined}
      <Value state="unknown" absent={originsProblem} />
    {/if}
  </div>

  {#if held !== undefined && held.services.length > 0}
    <ul class="entries" aria-label={m.catalogue_said()}>
      {#each short.of(held.services) as service (service.id)}
        <li>
          <h3>{service.name}</h3>
          <ul class="lines">
            {#each serviceLines(service, origins) as line, at (at)}
              <li><Said text={line} /></li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
    <ShowAll items={held.services} shortening={short} />
  {/if}

  {#if held !== undefined && held.removed.length > 0}
    <section class="dropped" aria-labelledby={droppedId}>
      <h3 id={droppedId}>{m.catalogue_dropped_said()}</h3>
      <ul class="lines">
        {#each held.removed as dropped, at (at)}
          <li><Said text={droppedLine(dropped)} /></li>
        {/each}
      </ul>
    </section>
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

  .entries {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entries > li,
  .dropped {
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
