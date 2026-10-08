<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import {
    standingLines,
    versionLines,
    type Standing,
    type Versions,
  } from "../../lib/copy";
  import type { Freshness } from "../../lib/freshness";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The versions in play, or why they could not be read. */
    versions: Reading<Versions> | undefined;
    /** Where this copy stands against the newest release, or why it could not be read. */
    standing: Reading<Standing> | undefined;
    /** When this panel's sources last answered. */
    freshness: Freshness;
  }

  let { versions, standing, freshness }: Props = $props();

  const versionsId = $props.id();
  const standingId = `${versionsId}-standing`;

  const versionsSaid = $derived(
    versions?.ok === true ? versionLines(versions.value) : undefined,
  );
  const versionsProblem = $derived(
    versions?.ok === false ? versions.problem.message : undefined,
  );
  const standingSaid = $derived(
    standing?.ok === true ? standingLines(standing.value) : undefined,
  );
  const standingProblem = $derived(
    standing?.ok === false ? standing.problem.message : undefined,
  );
</script>

<!--
  This copy of lemonfiber: the versions in play, and where it stands against
  the newest release, with exactly what to type to move it where lemonfiber
  knows. Each of the two readings says for itself that it has not answered, or
  why it could not be read. Nothing here moves anything.
-->
<Panel title={m.panel_copy()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.copy_prose()} /></p>
  </div>

  <section class="part" aria-labelledby={versionsId}>
    <h3 id={versionsId}>{m.copy_versions()}</h3>
    {#if versionsSaid !== undefined}
      <ul class="lines">
        {#each versionsSaid as line, at (at)}
          <li><Said text={line} /></li>
        {/each}
      </ul>
    {:else if versionsProblem !== undefined}
      <Value state="unknown" absent={versionsProblem} />
    {:else}
      <Skeleton width="14rem" label={m.waiting_answer()} />
    {/if}
  </section>

  <section class="part" aria-labelledby={standingId}>
    <h3 id={standingId}>{m.copy_moving()}</h3>
    {#if standingSaid !== undefined}
      <ul class="lines">
        {#each standingSaid as line, at (at)}
          <li><Said text={line} /></li>
        {/each}
      </ul>
    {:else if standingProblem !== undefined}
      <Value state="unknown" absent={standingProblem} />
    {:else}
      <Skeleton width="14rem" label={m.waiting_answer()} />
    {/if}
  </section>
</Panel>

<style>
  .scope {
    padding: var(--sp-4) var(--panel-pad) var(--sp-3);
  }

  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .part {
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
