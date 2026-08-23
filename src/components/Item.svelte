<script lang="ts">
  import type { Snippet } from "svelte";
  import Port from "./Port.svelte";
  import StateMark from "./StateMark.svelte";
  import { toneFor, type State } from "../lib/state";

  interface Props {
    /** How much the finding behind this row can be trusted. */
    state: State;
    /** The state in this row's own words, above the title. */
    eyebrow: string;
    /** What happened, as a sentence an operator can act on. */
    title: string;
    /** The rest of it: what it means, and what lemonfiber can do about it. */
    prose: string;
    /** Buttons. Omitted where there is nothing to press. */
    actions?: Snippet | undefined;
  }

  let { state, eyebrow, title, prose, actions }: Props = $props();

  const tone = $derived(toneFor(state));
</script>

<!--
  A row that wants the operator. The port carries the severity, the eyebrow
  carries the state in this row's own words, and the prose carries the rest.

  The port's icon is decorative here: the eyebrow beside it already says what
  it means, and announcing both would say it twice.

  The heading is an h3 — a row sits inside a panel, whose title is the h2.
-->
<article class="item" class:watch={tone === "watch"} class:alarm={tone === "alarm"}>
  <Port {tone} />
  <div>
    <p class="eyebrow">
      <StateMark {state} />
      <span class="word">{eyebrow}</span>
    </p>
    <h3>{title}</h3>
    <p class="prose">{prose}</p>
  </div>
  {#if actions !== undefined}
    <div class="acts">{@render actions()}</div>
  {/if}
</article>

<style>
  .item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--sp-4);
    align-items: start;
    padding: var(--sp-4) var(--panel-pad);
    background: var(--paper);
    border-bottom: 1px solid var(--line);
  }

  .item:last-child {
    border-bottom: 0;
  }

  .alarm {
    background: var(--alarm-tint);
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: var(--sp-tight);
    margin: 0 0 5px;
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--faint);
  }

  .watch .eyebrow {
    color: var(--fiber-deep);
  }

  .alarm .eyebrow {
    color: var(--alarm);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  h3 {
    margin: 0 0 4px;
    font-size: var(--text-item);
    font-weight: 600;
  }

  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  /* Stacked, so the prose keeps its measure rather than being squeezed by a
     row of buttons beside it. */
  .acts {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--sp-2);
    min-width: 168px;
  }

  /* Wide enough that the prose loses nothing by sitting them side by side. */
  @media (min-width: 1500px) {
    .acts {
      flex-direction: row;
      align-items: center;
      min-width: 0;
    }
  }

  /* Narrow enough that a column beside the prose leaves it unreadable, so the
     buttons drop below it instead. */
  @media (max-width: 760px) {
    .item {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .acts {
      grid-column: 2;
      flex-direction: row;
      flex-wrap: wrap;
      min-width: 0;
      margin-top: var(--sp-3);
    }
  }
</style>
