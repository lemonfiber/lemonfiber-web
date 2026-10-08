<script lang="ts">
  import { onMount } from "svelte";
  import Action from "../components/Action.svelte";
  import Banner from "../components/Banner.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import Console from "./Console.svelte";
  import Recovering from "./setup/Recovering.svelte";
  import Walking from "./setup/Walking.svelte";
  import Written from "./setup/Written.svelte";
  import { Setting } from "./setting.svelte";
  import type { Reaching } from "../api/asking";
  import { pausing as waiting, type Pausing } from "../api/redeeming";
  import { entryOf } from "../lib/wizard";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What reaching this run takes. */
    reaching: Reaching;
    /** What a refusal asks for. */
    onrefused: () => void;
    /** How the wait between one asking about a job and the next is taken. */
    pausing?: Pausing | undefined;
  }

  let { reaching, onrefused, pausing = waiting }: Props = $props();

  const setting = new Setting({
    reaching: () => reaching,
    onrefused: () => {
      onrefused();
    },
  });

  /** Whether the operator left the written screen for the console. */
  let opened = $state(false);

  const entry = $derived(entryOf(setting.read));

  onMount(() => {
    void setting.ask();
  });
</script>

<!--
  Before the console, whether this machine is set up. A machine with nothing
  configured gets the setup wizard in place of everything else until setup is
  written; one whose apply stopped part-way opens on the way out of it first;
  one that is set up gets the console. Setup written from here ends on the
  screen that starts and connects the stack, with the console one press away.
  An answer that cannot be read is said as that, and nothing is drawn over it.
-->
{#if setting.written && !opened}
  <main class="setup">
    <h1>{m.wizard_title()}</h1>
    <Written
      {reaching}
      {onrefused}
      {pausing}
      onopen={() => {
        opened = true;
      }}
    />
  </main>
{:else if entry === "console"}
  <Console {reaching} {onrefused} {pausing} />
{:else}
  <main class="setup">
    <h1>{m.wizard_title()}</h1>
    {#if setting.read?.ok === true && entry === "recovery"}
      <Recovering
        wizard={setting.read.value}
        busy={setting.busy}
        onmove={setting.move}
      />
    {:else if setting.read?.ok === true && entry === "wizard"}
      <Walking
        wizard={setting.read.value}
        busy={setting.busy}
        proving={setting.proving}
        onmove={setting.move}
      />
    {:else if setting.read?.ok === false}
      {#snippet again()}
        <Action
          label={m.action_wizard_ask_again()}
          off={setting.busy}
          onclick={setting.ask}
        />
      {/snippet}
      <Banner
        tone="watch"
        lead={m.wizard_unknown_lead()}
        prose={setting.read.problem.message}
        actions={again}
      />
    {:else}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {/if}
    <div role="status" aria-label={m.wizard_asked()}>
      {#if setting.said !== undefined}
        <p class="refused">{setting.said}</p>
      {/if}
    </div>
  </main>
{/if}

<style>
  .setup {
    display: grid;
    gap: var(--sp-5);
    max-width: 64rem;
    margin: 0 auto;
    padding: var(--sp-6) var(--sp-4);
  }

  h1 {
    margin: 0;
    font-size: var(--text-title);
  }

  .refused {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--alarm);
  }
</style>
