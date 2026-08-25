<script lang="ts">
  import Action from "../components/Action.svelte";
  import Field from "../components/Field.svelte";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What being handed a key asks for. */
    onopen: (token: string) => void;
  }

  let { onopen }: Props = $props();

  let typed = $state("");

  const given = $derived(typed.trim());
</script>

<!--
  The one thing the page cannot find out for itself.

  A run mints a key, prints it once, and expects it back in a header on every
  request. There is no cookie, no session and nowhere to look it up, so the page
  asks the person who read it off the terminal.
-->
<main class="ask">
  <h1>{m.unlock_title()}</h1>
  <p class="prose">{m.unlock_prose()}</p>

  <Field
    label={m.unlock_label()}
    value={typed}
    hint={m.unlock_hint()}
    oninput={(value: string) => {
      typed = value;
    }}
  />

  <Action
    label={m.unlock_open()}
    weight="firm"
    onclick={() => {
      if (given !== "") onopen(given);
    }}
  />
</main>

<style>
  .ask {
    max-width: 34rem;
    margin: 0 auto;
    padding: var(--sp-6) var(--sp-5);
  }

  h1 {
    margin: 0 0 var(--sp-3);
    font-family: var(--brandface);
    font-weight: 800;
    font-size: var(--lf-size-display-m);
    letter-spacing: -0.045em;
  }

  .prose {
    margin: 0 0 var(--sp-5);
    max-width: 62ch;
    color: var(--muted);
  }
</style>
