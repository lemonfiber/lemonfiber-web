<script lang="ts">
  /** One place the strip leads to. */
  interface Place {
    /** Tells this place from the others. Never shown. */
    id: string;
    /** What it is called. */
    label: string;
  }

  interface Props {
    /** What the strip navigates; the name the landmark is announced by. */
    label: string;
    /** The places, in the order they are shown. */
    items: readonly Place[];
    /** The id of the place being shown now. */
    selected: string;
    /** Called with the id of the place pressed. */
    onselect: (id: string) => void;
  }

  let { label, items, selected, onselect }: Props = $props();
</script>

<!--
  A named landmark holding a list of places, and the one being shown says so
  with `aria-current`.

  Not tabs, which is what the strip was first drawn as. A tab owns a panel and
  names it with `aria-controls`; this strip is a sibling of the body it
  changes and never sees it, so any tab it claimed to be would be a tab with
  no panel — and a tablist takes its items out of the tab order in exchange
  for arrow keys, which costs a reader the one thing a list of six buttons
  gives them for free.

  Six places a household can be looking at are six places, not six views of
  one thing, so they are read as a list and reached one tab at a time.
-->
<nav class="sub" aria-label={label}>
  <ul class="subnav">
    {#each items as item (item.id)}
      <li>
        <button
          type="button"
          aria-current={item.id === selected ? "true" : undefined}
          onclick={() => {
            onselect(item.id);
          }}>{item.label}</button
        >
      </li>
    {/each}
  </ul>
</nav>

<style>
  /* The border and the ground are the strip's, so they fill the column it is
     given whatever the list inside it comes to. */
  .sub {
    background: var(--pith);
    border-right: 1px solid var(--line);
  }

  .subnav {
    display: grid;
    gap: var(--sp-hair);
    align-content: start;
    padding: var(--sp-3);
    margin: 0;
    list-style: none;
  }

  li {
    min-width: 0;
  }

  button {
    width: 100%;
    padding: var(--sp-2) var(--sp-3);
    border-radius: var(--r-md);
    font-size: var(--text-prose);
    text-align: left;
    color: var(--muted);
    white-space: nowrap;
  }

  button:hover {
    background: var(--canvas);
    color: var(--text);
  }

  /* Inset rather than a border, so the current place does not move the two
     beside it. */
  button[aria-current="true"] {
    background: var(--paper);
    color: var(--text);
    font-weight: 600;
    box-shadow: inset 0 0 0 1px var(--line);
  }

  /* Too narrow for a column beside the body, so the strip lies across the top
     of it and scrolls sideways. */
  @media (max-width: 900px) {
    .sub {
      border-right: 0;
      border-bottom: 1px solid var(--line);
    }

    .subnav {
      display: flex;
      overflow-x: auto;
    }
  }
</style>
