<script lang="ts">
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import { oursLines, theirsLines, type Leaving } from "../../lib/leaving";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Everything that leaves this machine, or why it could not be read. */
    outbound: Reading<Leaving> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { outbound, freshness }: Props = $props();

  const oursId = $props.id();
  const theirsId = `${oursId}-theirs`;

  const leaving = $derived(outbound?.ok === true ? outbound.value : undefined);
  const problem = $derived(
    outbound?.ok === false ? outbound.problem.message : undefined,
  );
</script>

<!--
  Everything that leaves this machine: lemonfiber's own requests, each with
  where it goes, what travels, whether it is allowed and the setting that
  switches it off, and the requests the stack's services make, each with the
  service it belongs to. Nothing here changes anything; switching a request off
  is a setting, changed where the settings are.
-->
<Panel title={m.panel_outbound()} {freshness} flush>
  <div class="scope">
    <p>{m.outbound_prose()}</p>
    {#if leaving === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if leaving === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {/if}
  </div>

  {#if leaving !== undefined}
    <section class="account" aria-labelledby={oursId}>
      <h3 id={oursId}>{m.outbound_ours()}</h3>
      {#if leaving.ours.length === 0}
        <p>{m.outbound_none()}</p>
      {/if}
      <ul class="requests">
        {#each leaving.ours as one (one.reach)}
          <li>
            <h4>{one.purpose}</h4>
            <ul class="lines">
              {#each oursLines(one) as line, at (at)}
                <li><span class="word">{line}</span></li>
              {/each}
            </ul>
          </li>
        {/each}
      </ul>
    </section>

    <section class="account" aria-labelledby={theirsId}>
      <h3 id={theirsId}>{m.outbound_theirs()}</h3>
      {#if leaving.theirs.length === 0}
        <p>{m.outbound_none()}</p>
      {/if}
      <ul class="requests">
        {#each leaving.theirs as one, at (at)}
          <li>
            <h4>{one.service}</h4>
            <ul class="lines">
              {#each theirsLines(one) as line, said (said)}
                <li><span class="word">{line}</span></li>
              {/each}
            </ul>
          </li>
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

  .account {
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

  .requests {
    display: grid;
    gap: var(--sp-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .requests > li {
    display: grid;
    gap: var(--sp-1);
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
