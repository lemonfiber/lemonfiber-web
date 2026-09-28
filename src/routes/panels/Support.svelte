<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Switch from "../../components/Switch.svelte";
  import { linesOf } from "../../lib/came";
  import type { Freshness } from "../../lib/freshness";
  import {
    LOG_LINES,
    linesTyped,
    standingBundle,
    type Keeper,
  } from "../../lib/upkeep";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the support panel can ask for, and what has come of asking. */
    keeper: Keeper;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { keeper, freshness }: Props = $props();

  const bundleId = $props.id();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** How many log lines to take from each service, as typed. */
  let typed = $state(String(LOG_LINES));

  /**
   * The last count typed that was one. The control that sends it is silenced
   * while what is typed is not a count, so this is what is sent.
   */
  let counted = $state(LOG_LINES);

  /** Whether media filenames are shown rather than replaced. */
  let filenames = $state(false);

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  const work = $derived(keeper.work.filter((one) => one.doing === "support"));
  const standing = $derived(standingBundle(work));
  const logs = $derived(linesTyped(typed));
  const parted = $derived(standing !== undefined || work.length > 0);
</script>

<!--
  Gathering what somebody helping with this machine would need, into one file.

  A bundle is described before it is written. The description is the whole of
  it: every file it would hold, in full and already redacted, how large it
  would be and where it would go. Writing it sends the terms the description
  was read under, so what is written is what was read. Terms changed above after
  it reach nothing until a description is asked for on them.

  The bundle is written where lemonfiber keeps its own files, and the record
  says where. Nothing is handed to the browser.
-->
<Panel title={m.panel_support()} {freshness} flush>
  <div class="scope">
    <p>{m.support_prose()}</p>
  </div>

  <div class="terms">
    <Field
      label={m.support_logs()}
      value={typed}
      figure
      hint={logs === undefined ? m.support_logs_unread() : undefined}
      oninput={(value: string) => {
        typed = value;
        counted = linesTyped(value) ?? counted;
      }}
    />
    <div class="choice">
      <p class="prose">{m.support_filenames()}</p>
      <Switch
        on={filenames}
        label={m.support_filenames()}
        onclick={() => {
          filenames = !filenames;
        }}
      />
    </div>
  </div>

  <div class="controls" role="group" aria-label={m.support_controls()}>
    <Action
      label={m.action_support_describe()}
      off={keeper.busy || logs === undefined}
      onclick={() => {
        keeper.onask({ doing: "support", terms: { logs: counted, filenames } });
      }}
    />
  </div>

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.support_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if standing !== undefined}
      <section class="bundle" aria-labelledby={bundleId}>
        <h3 id={bundleId}>{m.support_bundle_title()}</h3>
        <p class="prose">{m.support_bundle_prose()}</p>
        <ul class="pieces">
          {#each standing.pieces as piece (piece.name)}
            <li>
              <details>
                <summary>{piece.name}</summary>
                <pre>{piece.body}</pre>
              </details>
            </li>
          {/each}
        </ul>
        <div class="controls">
          <Action
            label={m.action_support_write()}
            weight="firm"
            off={keeper.busy}
            onclick={() => {
              keeper.onask({
                doing: "support",
                terms: standing.terms,
                write: true,
              });
              landing();
            }}
          />
          <Action
            label={m.action_leave_as_is()}
            onclick={() => {
              keeper.ondrop(standing.id);
              landing();
            }}
          />
        </div>
      </section>
    {/if}

    {#each work as one (one.id)}
      {@const read = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            keeper.ondrop(one.id);
            landing();
          }}
        />
      {/snippet}
      <Item
        state={read.state}
        eyebrow={read.eyebrow}
        title={titleOfDoing(one.doing, one.scoped)}
        prose={read.prose}
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

  .terms {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--panel-pad) 0;
  }

  .choice {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-4);
    align-items: center;
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

  .bundle {
    padding: var(--sp-4) 0 0;
    border-bottom: 1px solid var(--line);
  }

  .bundle h3,
  .bundle > .prose {
    padding: 0 var(--panel-pad);
  }

  h3 {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-item);
    font-weight: 600;
  }

  .pieces {
    display: grid;
    margin: var(--sp-3) 0 0;
    padding: 0;
    list-style: none;
  }

  .pieces li {
    padding: var(--sp-2) var(--panel-pad);
    border-top: 1px solid var(--line);
    min-width: 0;
  }

  summary {
    font-family: var(--mono);
    font-size: var(--text-note);
    cursor: pointer;
    overflow-wrap: anywhere;
  }

  pre {
    margin: var(--sp-2) 0 0;
    padding: var(--sp-3);
    font-family: var(--mono);
    font-size: var(--text-note);
    color: var(--muted);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    background: var(--pith);
    border-radius: var(--r-sm);
  }
</style>
