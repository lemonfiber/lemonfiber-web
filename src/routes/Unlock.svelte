<script lang="ts">
  import Action from "../components/Action.svelte";
  import Banner from "../components/Banner.svelte";
  import Field from "../components/Field.svelte";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What being handed a key asks for. */
    onopen: (token: string) => void;
    /**
     * Whether this screen replaced a console the run turned away, rather than
     * being the first thing a tab was shown.
     */
    refused?: boolean | undefined;
  }

  let { onopen, refused = false }: Props = $props();

  let typed = $state("");

  const given = $derived(typed.trim());

  /**
   * Put the reader at the top of the screen that replaced the one they had.
   *
   * A console swapped out under them leaves focus on the document: the next tab
   * starts at the top of the page and nothing says why the screen changed. The
   * title is where the answer begins, so that is where they are put.
   */
  function landing(node: HTMLElement): void {
    if (refused) node.focus();
  }
</script>

<!--
  The one thing the page cannot find out for itself.

  A run mints a key, prints it once, and expects it back in a header on every
  request. There is no cookie, no session and nowhere to look it up, so the page
  asks the person who read it off the terminal.

  Where it replaced a console the run turned away, it says so where a reader who
  cannot see the screen change is told, and takes the focus the swapped-out
  screen dropped.
-->
<main class="ask">
  <h1 tabindex="-1" use:landing>{m.unlock_title()}</h1>
  {#if refused}
    <div class="why">
      <Banner
        tone="alarm"
        lead={m.unlock_refused_lead()}
        prose={m.unlock_refused_prose()}
      />
    </div>
  {/if}
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

  .why {
    margin: 0 0 var(--sp-5);
  }

  /* The title is where focus is put when this screen replaces a console, and it
     is not a place the tab order stops at, so the ring would mark somewhere
     nobody steered to. */
  h1:focus {
    outline: none;
  }

  .prose {
    margin: 0 0 var(--sp-5);
    max-width: 62ch;
    color: var(--muted);
  }
</style>
