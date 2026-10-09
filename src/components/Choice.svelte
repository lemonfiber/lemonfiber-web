<script lang="ts">
  import Switch from "./Switch.svelte";

  interface Props {
    /** What the switch turns on, said beside it and announced by it. */
    words: string;
    /** Whether it is on. */
    on: boolean;
    /** What flipping it asks for. */
    onclick: () => void;
  }

  let { words, on, onclick }: Props = $props();
</script>

<!--
  A switch with its words beside it, for a form that asks one thing at a time.

  A switch carries no words of its own, and one drawn alone under a question
  leaves the reader to guess which of two bare toggles is which. The words here
  are the same ones the switch is announced by, so what is read and what is
  heard cannot drift apart.
-->
<div class="choice">
  <span class="words">{words}</span>
  <Switch {on} label={words} {onclick} />
</div>

<style>
  .choice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-4);
    width: 100%;
    max-width: 30rem;
    font-size: var(--text-prose);
  }
</style>
