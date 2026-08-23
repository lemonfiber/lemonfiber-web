<script lang="ts">
  import type { Block } from "../lib/ground";

  interface Props {
    /** What the blocks add up to; the name the list is announced by. */
    label: string;
    /** The blocks, in any order. */
    blocks: readonly Block[];
  }

  let { label, blocks }: Props = $props();

  // Biggest first, so what is drawn first, read first and drawn largest are
  // one order rather than three.
  const ordered = $derived([...blocks].sort((a, b) => b.share - a.share));
</script>

<!--
  Where a whole went, as areas. A list, and every block says its name and its
  amount in words — the colour and the area are a second telling of an order
  the reading already carries, so a reader who has neither still has all of it.
-->
<ul class="treemap" aria-label={label}>
  {#each ordered as block, index (block.name)}
    <li
      class="tm"
      class:tall={index === 0}
      class:biggest={block.ground === "biggest"}
      class:next={block.ground === "next"}
      class:other={block.ground === "other"}
      class:free={block.ground === "free"}
    >
      <span class="name">{block.name}</span>
      <span class="amount">{block.value}</span>
    </li>
  {/each}
</ul>

<style>
  .treemap {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    grid-auto-rows: 4.875rem;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Three columns of this is a strip of slivers on a phone. */
  @media (max-width: 720px) {
    .treemap {
      grid-template-columns: 1fr 1fr;
    }
  }

  .tm {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--sp-3);
    border: 1px solid var(--ink);
    border-radius: var(--r-sm);
    min-width: 0;
  }

  /* The biggest share is drawn first, so the tall cell packs the grid rather
     than leaving a hole in it. */
  .tall {
    grid-row: span 2;
  }

  /* Lemon and fiber are the same in both themes, so what sits on them does not
     follow the ink that flips with them. */
  .biggest {
    background: var(--lemon);
    color: var(--on-lemon);
  }

  .next {
    background: var(--fiber);
    color: var(--on-lemon);
  }

  /* The system replaces the grounds these sit on, so the words stop following
     a lemon that is no longer there. What the blocks say is said by their size;
     the border keeps them apart once the fills are gone. */
  @media (forced-colors: active) {
    .biggest,
    .next {
      color: CanvasText;
    }
  }

  .other {
    background: var(--pith);
  }

  .free {
    background: var(--canvas);
  }

  .name {
    font-size: var(--text-control);
    font-weight: 600;
  }

  .amount {
    font-family: var(--mono);
    font-size: var(--text-legend);
  }
</style>
