<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Panel from "../../components/Panel.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import { heldLine, shortLines, type Stuck } from "../../lib/stuck";
  import type { Tracer } from "../tracing.svelte";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The stuck items, or why they could not be read. */
    stuck: Reading<Stuck>;
    /**
     * What following one item asks for. Left out where nothing answers it,
     * which draws the items alone.
     */
    tracer?: Tracer | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { stuck, tracer, freshness }: Props = $props();
</script>

<!--
  Every item whose download is stuck, with the service whose queue holds it and
  the stage it stopped at. Following one asks where that item is, and the
  answer is drawn where every item looked up is. A list that may be short says
  so above it.
-->
<Panel title={m.panel_stuck()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.stuck_prose()} /></p>
    {#if stuck.ok}
      {#each shortLines(stuck.value) as line, at (at)}
        <p>{line}</p>
      {/each}
      {#if stuck.value.items.length === 0}
        <p><Said text={m.stuck_none()} /></p>
      {/if}
    {/if}
    {#if !stuck.ok}
      <Value state="unknown" absent={stuck.problem.message} />
    {/if}
  </div>

  {#if stuck.ok && stuck.value.items.length > 0}
    <ul class="items" aria-label={m.stuck_said()}>
      {#each stuck.value.items as item, place (place)}
        <li>
          <h3>{item.title}</h3>
          <p>{heldLine(item)}</p>
          {#if tracer !== undefined}
            {@const following = tracer}
            <Action
              label={m.action_stuck_follow({ title: item.title })}
              off={following.busy}
              onclick={() => {
                following.onlook({ term: item.title, season: undefined });
              }}
            />
          {/if}
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
    overflow-wrap: anywhere;
  }

  .items {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .items > li {
    display: grid;
    gap: var(--sp-2);
    justify-items: start;
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }
</style>
