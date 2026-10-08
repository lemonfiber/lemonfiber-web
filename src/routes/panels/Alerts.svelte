<script lang="ts">
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { exceptionLine, presetLines, type Alerts } from "../../lib/alerts";
  import type { Freshness } from "../../lib/freshness";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the operator is told about, or why it could not be read. */
    alerts: Reading<Alerts> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { alerts, freshness }: Props = $props();

  const told = $derived(alerts?.ok === true ? alerts.value : undefined);
  const problem = $derived(
    alerts?.ok === false ? alerts.problem.message : undefined,
  );
</script>

<!--
  What the operator is told about: the preset in force and what it means, in
  lemonfiber's words, and each kind of event set apart from it. Nothing here
  changes what is told.
-->
<Panel title={m.panel_alerts()} {freshness} flush>
  <div class="scope">
    <p>{m.alerts_prose()}</p>
    {#if told === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if told === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {:else}
      {#each presetLines(told) as line, at (at)}
        <p>{line}</p>
      {/each}
      {#if told.exceptions.length === 0}
        <p>{m.alerts_none()}</p>
      {/if}
    {/if}
  </div>

  {#if told !== undefined && told.exceptions.length > 0}
    <ul class="exceptions" aria-label={m.alerts_said()}>
      {#each told.exceptions as exception (exception.kind)}
        <li><span class="word">{exceptionLine(exception)}</span></li>
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

  .exceptions {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    list-style: none;
  }

  .exceptions li {
    font-size: var(--text-prose);
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
