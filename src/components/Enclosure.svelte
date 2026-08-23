<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /**
     * What holds these nodes, set on the border. A group given none draws no
     * box at all: it lines its parts up and claims nothing about them.
     */
    label?: string | undefined;
    /** Stacks the parts rather than running them across. */
    column?: boolean | undefined;
    /** The nodes, and the connectors between them. */
    children: Snippet;
  }

  let { label, column = false, children }: Props = $props();

  const tagId = $props.id();
  const named = $derived(label === undefined ? undefined : tagId);
</script>

<!--
  The box that says what holds a set of nodes. The tag sits on the border, and
  the page's own ground behind the words is what breaks the line.

  The tag is the box's name, not a heading: the section takes it through
  `aria-labelledby`, so the box is announced on the way in and reachable on its
  own, and the nodes inside it are heard as inside it. What the diagram claims
  is containment, and here containment is structure rather than a sentence
  describing one.

  A box given no words draws nothing: the row that carries the whole flow and
  the branch sitting behind one connector are both groupings, and a border
  around either would say a thing holds them that does not.
-->
<section
  class="encl"
  class:bare={label === undefined}
  class:column
  aria-labelledby={named}
>
  {#if label !== undefined}
    <span class="tag" id={tagId}>{label}</span>
  {/if}
  {@render children()}
</section>

<style>
  .encl {
    /* The room the nodes inside stand at. A box that stacks them lowers it. */
    --node-min-width: 132px;
    --node-min-height: 58px;
    position: relative;
    display: flex;
    align-items: stretch;
    gap: var(--sp-3);
    padding: var(--sp-3);
    border: 1.5px solid var(--ink);
    border-radius: var(--r-md);
    background: var(--pith);
  }

  .tag {
    position: absolute;
    top: -8px;
    left: 10px;
    padding: 0 var(--sp-tight);
    background: var(--paper);
    color: var(--muted);
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
  }

  /* Nothing holds these but the box they are in, so nothing is drawn. */
  .bare {
    gap: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: none;
  }

  .column {
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--sp-2) var(--sp-2);
  }

  /* A drawn box that stacks stands in a column narrower than a node's own
     width, so its nodes shrink to it. */
  .column:not(.bare) {
    --node-min-width: 0;
  }

  /* Two nodes sharing one connector: they divide the height a single node
     would have taken rather than each taking it. */
  .bare.column {
    display: grid;
    padding: 0;
    --node-min-height: 0;
  }
</style>
