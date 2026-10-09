<script lang="ts">
  import Action from "./Action.svelte";
  import type { Shortening } from "../lib/shortening.svelte";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** The list it shortens. */
    items?: readonly unknown[] | undefined;
    /** Several lists it shortens under one press, each to its first few. */
    groups?: readonly (readonly unknown[])[] | undefined;
    /** Whether the lists are shown whole, and how to change that. */
    shortening: Shortening;
    /**
     * Whether it is set in from the panel's edge, as the rows of a flush panel
     * are. Left out inside a part that is set in already.
     */
    inset?: boolean | undefined;
  }

  let { items = [], groups = [], shortening, inset = true }: Props = $props();

  /** Every list it shortens. */
  const lists = $derived([items, ...groups]);

  /** How many there are in all. */
  const count = $derived(lists.reduce((all, list) => all + list.length, 0));
</script>

<!--
  The press that shows the whole of a shortened list, or its first few again.
  It says how many there are, so the reader knows what they would be asking
  for, and is drawn only where a list is longer than what is shown.
-->
{#if lists.some((list) => shortening.shortens(list))}
  <div class="all" class:inset>
    <Action
      label={shortening.whole
        ? m.action_show_fewer()
        : m.action_show_all({ count })}
      onclick={shortening.flip}
    />
  </div>
{/if}

<style>
  .all {
    padding: var(--sp-2) 0 var(--sp-3);
  }

  .inset {
    padding-inline: var(--panel-pad);
  }
</style>
