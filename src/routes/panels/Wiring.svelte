<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import Choosing from "./Choosing.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { choosable, type Filler } from "../../lib/filling";
  import type { Freshness } from "../../lib/freshness";
  import { linkLines, unfilledLine, type Wiring } from "../../lib/wiring";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the stack wires to what, or why it could not be read. */
    wiring: Reading<Wiring> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
    /**
     * What choosing a filler asks for. Left out where nothing answers it,
     * which offers no choice.
     */
    filler?: Filler | undefined;
  }

  let { wiring, freshness, filler }: Props = $props();

  const unfilledId = $props.id();

  const wired = $derived(wiring?.ok === true ? wiring.value : undefined);
  const problem = $derived(
    wiring?.ok === false ? wiring.problem.message : undefined,
  );
</script>

<!--
  What each service in the stack is wired to: each link under the service it
  runs from, with what it asks for and how that was settled, and every ask
  nothing fills under them; then, where several services claim one, choosing
  which fills it.
-->
<Panel title={m.panel_wiring()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.wiring_prose()} /></p>
    {#if wired === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if wired === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {:else if wired.wired.length === 0}
      <p><Said text={m.wiring_none()} /></p>
    {/if}
  </div>

  {#if wired !== undefined && wired.wired.length > 0}
    <ul class="entries" aria-label={m.wiring_said()}>
      {#each wired.wired as link, place (place)}
        <li>
          <h3>{link.by}</h3>
          <ul class="lines">
            {#each linkLines(link) as line, at (at)}
              <li><Said text={line} /></li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  {/if}

  {#if wired !== undefined && wired.unfilled.length > 0}
    <section class="unfilled" aria-labelledby={unfilledId}>
      <h3 id={unfilledId}>{m.wiring_unfilled_said()}</h3>
      <ul class="lines">
        {#each wired.unfilled as one, at (at)}
          <li><Said text={unfilledLine(one)} /></li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if filler !== undefined && wired !== undefined && (choosable(wired).length > 0 || filler.work.length > 0)}
    <Choosing wiring={wired} {filler} />
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
  .unfilled {
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
