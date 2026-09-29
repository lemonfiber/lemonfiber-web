<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Switch from "../../components/Switch.svelte";
  import { linesOf } from "../../lib/came";
  import type { Freshness } from "../../lib/freshness";
  import { stepLine } from "../../lib/updated";
  import { standingPlan, type Updater } from "../../lib/updating";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What moving onto this build's pins asks for, and what came of it. */
    updater: Updater;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { updater, freshness }: Props = $props();

  const planId = $props.id();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Whether what is still coming down is let finish before anything moves. */
  let wait = $state(false);

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  const plan = $derived(standingPlan(updater.work));
  const parted = $derived(updater.work.length > 0);
</script>

<!--
  Moving the stack onto the versions this build pins.

  What updating would change is read first: unconfirmed, it moves nothing and
  answers with every step, how large each is, whether anything walks it back
  and what it means. The yes under that is the same request, confirmed. Where
  the download clients are still working on something, the yes carries whether
  it is let finish first.
-->
<Panel title={m.panel_updates()} {freshness} flush>
  <div class="scope">
    <p>{m.updates_prose()}</p>
  </div>

  <div class="controls">
    <Action
      label={m.action_update_plan()}
      off={updater.busy}
      onclick={() => {
        updater.onask({ doing: "update" });
        wait = false;
        landing();
      }}
    />
  </div>

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.updates_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if plan !== undefined}
      <section class="plan" aria-labelledby={planId}>
        <h3 id={planId}>{m.update_plan_title()}</h3>
        <p class="prose">{m.update_plan_prose()}</p>
        <ul class="steps">
          {#each plan.steps as step (step.service)}
            <li><span class="word">{stepLine(step)}</span></li>
          {/each}
        </ul>
        {#if plan.inFlight.length > 0}
          <div class="choice">
            <p class="prose">{m.update_wait()}</p>
            <Switch
              on={wait}
              label={m.update_wait()}
              onclick={() => {
                wait = !wait;
              }}
            />
          </div>
        {/if}
        <div class="acts">
          <Action
            label={m.action_update_yes()}
            weight="firm"
            off={updater.busy}
            onclick={() => {
              updater.onask({ doing: "update", confirm: true, wait });
              landing();
            }}
          />
          <Action
            label={m.action_leave_as_is()}
            onclick={() => {
              updater.ondrop(plan.id);
              landing();
            }}
          />
        </div>
      </section>
    {/if}

    {#each updater.work as one (one.id)}
      {@const said = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            updater.ondrop(one.id);
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
  </div>
</Panel>

<style>
  .scope {
    padding: var(--sp-4) var(--panel-pad) 0;
  }

  .scope p,
  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
  }

  /* The rule appears only when there is something under it, so a panel nobody
     has asked anything of ends at its own border rather than at a spare line. */
  .parted {
    border-top: 1px solid var(--line);
  }

  /* Focus is put here after a row is taken away, and it is not a place the tab
     order stops at, so the ring would mark somewhere nobody steered to. */
  .asked:focus {
    outline: none;
  }

  .plan {
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

  .steps {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    font-size: var(--text-prose);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  .choice {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-4);
    align-items: center;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
