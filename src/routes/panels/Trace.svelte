<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import { linesOf } from "../../lib/came";
  import { soughtTyped, type Finder } from "../../lib/finding";
  import type { Freshness } from "../../lib/freshness";
  import { traceLines } from "../../lib/traced";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import type { Tracer } from "../tracing.svelte";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Where the item looked up last is, and how to look one up. */
    tracer: Tracer;
    /** What searching the indexers for an item asks for. */
    finder: Finder;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { tracer, finder, freshness }: Props = $props();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** What it is called, as typed. */
  let term = $state("");

  /** Which season, as typed; empty is every season. */
  let season = $state("");

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  const sought = $derived(soughtTyped(term, season));
  const typed = $derived(term.trim() !== "" || season.trim() !== "");
  const reading = $derived(tracer.reading);
  const work = $derived(finder.work.filter((one) => one.doing === "search"));
</script>

<!--
  Where one item is: how far it got, why it stopped, how sure the trace is, and
  what happened to it.

  Looking it up is a reading, and changes nothing. Searching the indexers for it
  now is the same question widened: lemonfiber asks the indexers, and answers
  with where the item is once it has.
-->
<Panel title={m.panel_trace()} {freshness} flush>
  <div class="scope">
    <p>{m.trace_prose()}</p>
  </div>

  <div class="form">
    <div class="fields">
      <Field
        label={m.trace_term()}
        value={term}
        oninput={(value: string) => {
          term = value;
        }}
      />
      <Field
        label={m.trace_season()}
        value={season}
        figure
        hint={typed && sought === undefined
          ? m.trace_unread()
          : m.trace_season_hint()}
        oninput={(value: string) => {
          season = value;
        }}
      />
    </div>
    <div class="acts">
      {#if sought === undefined}
        <Action label={m.action_trace()} weight="firm" off />
        <Action label={m.action_search()} off />
      {:else}
        {@const looking = sought}
        <Action
          label={m.action_trace()}
          weight="firm"
          off={tracer.busy}
          onclick={() => {
            tracer.onlook(looking);
          }}
        />
        <Action
          label={m.action_search()}
          off={finder.busy}
          onclick={() => {
            finder.onask({ doing: "search", sought: looking });
            landing();
          }}
        />
      {/if}
    </div>
  </div>

  {#if reading !== undefined || tracer.busy}
    <div class="answer">
      {#if reading?.ok === true}
        <ul aria-label={m.trace_said()}>
          {#each traceLines(reading.value) as one, at (at)}
            <li><span class="word">{one}</span></li>
          {/each}
        </ul>
      {:else if reading?.ok === false}
        <Value state="unknown" absent={reading.problem.message} />
      {:else}
        <Skeleton width="16rem" label={m.waiting_answer()} />
      {/if}
    </div>
  {/if}

  <div
    class="asked"
    class:parted={work.length > 0}
    role="status"
    aria-label={m.trace_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#each work as one (one.id)}
      {@const said = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            finder.ondrop(one.id);
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

  .scope p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .form {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--panel-pad);
  }

  .fields {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(6rem, 10rem);
    gap: var(--sp-3);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }

  .answer {
    padding: 0 var(--panel-pad) var(--sp-3);
  }

  ul {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
    max-width: 76ch;
  }

  li {
    font-size: var(--text-prose);
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
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
</style>
