<script lang="ts">
  import type { Snippet } from "svelte";
  import StateMark from "./StateMark.svelte";
  import { type Freshness, stampFor, stateFor } from "../lib/freshness";

  interface Props {
    /** The heading, and the panel's accessible name. */
    title: string;
    /** When this panel's own source last answered. */
    freshness: Freshness;
    /** What the panel shows while its source is answering. */
    children: Snippet;
    /**
     * Replaces the body. Giving one is what makes the panel dead, so a panel
     * cannot be shown as unreachable and still be showing figures.
     */
    dead?: Snippet | undefined;
    /** Drops the body's padding, for rows and tables that meet the border. */
    flush?: boolean | undefined;
  }

  let { title, freshness, children, dead, flush = false }: Props = $props();

  const headingId = $props.id();
  const isDead = $derived(dead !== undefined);
  const state = $derived(stateFor(freshness));
  const stamp = $derived(stampFor(freshness));
</script>

<!--
  Each panel stamps its own freshness. A screen is drawn from several sources,
  and one of them falling silent makes that panel's figures untrustworthy and
  nothing else's — so the stamp sits on the panel, and a dead panel says so
  inside its own border while the rest of the screen carries on.
-->
<section class="panel" class:is-dead={isDead} aria-labelledby={headingId}>
  <header>
    <h2 id={headingId}>{title}</h2>
    <span class="stamp" class:is-dead={isDead}>
      <StateMark {state} />
      <span class="age">{stamp}</span>
    </span>
  </header>
  <div class="body" class:flush>
    {#if dead === undefined}
      {@render children()}
    {:else}
      {@render dead()}
    {/if}
  </div>
</section>

<style>
  .panel {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--r-md);
  }

  /* A dead panel drops to the page's own ground: it is a hole in the screen,
     not a card sitting on it. */
  .panel.is-dead {
    background: var(--canvas);
  }

  header {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--panel-pad);
    border-bottom: 1px solid var(--line);
  }

  h2 {
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: -0.005em;
    margin: 0;
  }

  .stamp {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 10.5px;
    color: var(--faint);
    white-space: nowrap;
  }

  .stamp.is-dead {
    color: var(--alarm);
  }

  .age {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  .body {
    padding: var(--panel-pad);
  }

  .flush {
    padding: 0;
  }
</style>
