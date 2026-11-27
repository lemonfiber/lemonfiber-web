<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Said from "../../components/Said.svelte";
  import { linesOf } from "../../lib/came";
  import type { Freshness } from "../../lib/freshness";
  import {
    linesOfScheduled,
    saidOfScheduled,
    stateOfScheduled,
    wordOfScheduled,
    type Scheduled,
  } from "../../lib/scheduled";
  import { standingRun, type Runner } from "../../lib/scheduling";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Every run-and-exit service, with how its last run ended. */
    scheduled: readonly Scheduled[];
    /** When this panel's source last answered. */
    freshness: Freshness;
    /**
     * What running one now asks for, and what came of it. Left out where
     * nothing can be asked, which draws the services alone.
     */
    runner?: Runner | undefined;
  }

  let { scheduled, freshness, runner }: Props = $props();

  const rehearsalId = $props.id();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }
</script>

<!--
  The services that run and exit on a schedule, each with how its last run
  ended, and the last lines it wrote where that run failed.

  Running one now is rehearsed first: what comes back says whether a run would
  go, or what holds it back, and the yes is offered only where nothing does.
-->
<Panel title={m.panel_scheduled()} {freshness} flush>
  {#each scheduled as one (one.id)}
    {@const lines = linesOfScheduled(one)}
    {@const item = {
      state: stateOfScheduled(one),
      eyebrow: wordOfScheduled(one),
      title: one.name,
      prose: saidOfScheduled(one),
      lines:
        lines === undefined
          ? undefined
          : { named: m.scheduled_lines(), said: lines },
    }}
    {#if runner === undefined}
      <Item {...item} />
    {:else}
      {#snippet running()}
        <Action
          acts="run"
          label={m.action_run_rehearse({ name: one.name })}
          off={runner.busy}
          onclick={() => {
            runner.onask({ doing: "run", service: one.id });
            landing();
          }}
        />
      {/snippet}
      <Item {...item} actions={running} />
    {/if}
  {/each}

  <div
    class="asked"
    class:parted={runner !== undefined && runner.work.length > 0}
    role="status"
    aria-label={m.scheduled_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if runner !== undefined}
      {@const standing = standingRun(runner.work, scheduled)}
      {#if standing !== undefined}
        <section class="rehearsal" aria-labelledby={rehearsalId}>
          <h3 id={rehearsalId}>
            {m.scheduled_rehearsal_title({ name: standing.name })}
          </h3>
          <p class="prose"><Said text={standing.said} /></p>
          <ul class="found">
            {#each standing.lines as line, at (at)}
              <li><Said text={line} /></li>
            {/each}
          </ul>
          <div class="acts">
            {#if standing.ready}
              <Action
                acts="run"
                label={m.action_run_yes({ name: standing.name })}
                weight="firm"
                off={runner.busy}
                onclick={() => {
                  runner.onask({
                    doing: "run",
                    service: standing.service,
                    agreed: true,
                  });
                  landing();
                }}
              />
            {/if}
            <Action
              label={m.action_leave_as_is()}
              onclick={() => {
                runner.ondrop(standing.id);
                landing();
              }}
            />
          </div>
        </section>
      {/if}

      {#each runner.work as one (one.id)}
        {@const said = readingOf(one)}
        {#snippet dropping()}
          <Action
            label={m.action_hide_record()}
            onclick={() => {
              runner.ondrop(one.id);
              landing();
            }}
          />
        {/snippet}
        <Item
          state={said.state}
          eyebrow={said.eyebrow}
          title={titleOfDoing(one.doing, one.scoped)}
          prose={said.prose}
          lines={one.at === "done"
            ? { named: m.came_heading(), said: linesOf(one.came) }
            : undefined}
          actions={dropping}
        />
      {/each}
    {/if}
  </div>
</Panel>

<style>
  .parted {
    border-top: 1px solid var(--line);
  }

  .asked:focus {
    outline: none;
  }

  .rehearsal {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-4) var(--panel-pad);
    border-bottom: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .found {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-prose);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
