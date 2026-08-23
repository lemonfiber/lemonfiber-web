<script lang="ts">
  import type { Snippet } from "svelte";
  import Avatar from "./Avatar.svelte";
  import Meter from "./Meter.svelte";
  import Tag from "./Tag.svelte";

  interface Props {
    /** Who they are. */
    name: string;
    /** What they can do, and when they were last here. */
    prose: string;
    /** How much of their allowance is gone, in words. */
    quota: string;
    /** A word beside the name: which of them is you, how old a child is. */
    tag?: string | undefined;
    /**
     * The same allowance as a length, from 0 to 1. Left out where there is no
     * limit to draw one against.
     */
    part?: number | undefined;
    /** What can be done about them. */
    actions?: Snippet | undefined;
  }

  let { name, prose, quota, tag, part, actions }: Props = $props();

  const drawn = $derived(part !== undefined);
</script>

<!--
  One person in the household: who they are, what they can do, how much of
  their allowance is gone, and what can be done about it.

  The allowance is words first. A bar is drawn beside them only where there is
  a limit to draw one against — "No limit" and "Can't ask" have no length —
  and where it is drawn the words become the bar's own name rather than being
  read out a second time beside it.

  The heading is an h4 — a row sits inside a subview, whose title is the h3.
-->
<div class="person">
  <Avatar {name} />
  <div class="who">
    <h4>
      <span class="nm">{name}</span>
      {#if tag !== undefined}
        <Tag label={tag} />
      {/if}
    </h4>
    <p class="sub">{prose}</p>
  </div>
  <div class="quota">
    <span
      class="lbl"
      class:plain={!drawn}
      aria-hidden={drawn ? "true" : undefined}>{quota}</span
    >
    {#if part !== undefined}
      <Meter {part} label={quota} />
    {/if}
  </div>
  {#if actions !== undefined}
    <div class="pacts">{@render actions()}</div>
  {/if}
</div>

<style>
  .person {
    display: grid;
    grid-template-columns: 2.5rem minmax(0, 1fr) 9.375rem auto;
    gap: var(--sp-4);
    align-items: center;
    padding: var(--sp-4) 0;
    border-bottom: 1px solid var(--line-soft);
  }

  .person:last-child {
    border-bottom: 0;
  }

  /* Narrow enough that four columns leave the name nowhere to go, so the
     allowance and the buttons drop underneath it instead. */
  @media (max-width: 820px) {
    .person {
      grid-template-columns: 2.5rem 1fr;
    }

    .quota,
    .pacts {
      grid-column: 2;
    }
  }

  .who {
    min-width: 0;
  }

  h4 {
    display: flex;
    align-items: center;
    gap: var(--sp-tight);
    margin: 0;
    font-size: var(--text-body);
    font-weight: 600;
  }

  .nm {
    min-width: 0;
  }

  .sub {
    margin: 0;
    font-size: var(--text-note);
    color: var(--faint);
  }

  .quota {
    display: grid;
    gap: var(--sp-1);
  }

  .lbl {
    font-size: var(--text-tag);
    color: var(--faint);
  }

  /* Nothing drawn under it, so it reads at the size the row's other asides
     take rather than at the size a bar's label takes. */
  .plain {
    font-size: var(--text-note);
  }

  .pacts {
    display: flex;
    gap: var(--sp-2);
  }
</style>
