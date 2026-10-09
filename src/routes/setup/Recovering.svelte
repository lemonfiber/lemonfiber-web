<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Said from "../../components/Said.svelte";
  import {
    everyRecovery,
    proseOfRecovery,
    titleOfRecovery,
    type Move,
    type Recovery,
    type Wizard,
  } from "../../lib/wizard";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Where setup stands: an apply that stopped part-way. */
    wizard: Wizard;
    /** Whether a step is out, which silences every control. */
    busy: boolean;
    /** Take one step. */
    onmove: (move: Move) => void;
  }

  let { wizard, busy, onmove }: Props = $props();

  const titleId = $props.id();

  /** Starting over forgets every answer, so it is asked once more. */
  let forgetting = $state(false);

  /** Take one way out, asking once more before starting over. */
  function choose(choice: Recovery): void {
    if (choice === "start-over" && !forgetting) {
      forgetting = true;
      return;
    }
    forgetting = false;
    onmove({ move: "recover", choice });
  }
</script>

<!--
  An apply that stopped part-way, named before anything else is offered: what
  it had already written, then the three ways out, each with what it does.
  Starting over forgets every answer as well as undoing what was written, so
  it is asked once more before it is sent.
-->
<section class="recovering" aria-labelledby={titleId}>
  <h2 id={titleId}>{m.wizard_recovery_title()}</h2>
  <p class="prose"><Said text={m.wizard_recovery_prose()} /></p>
  {#if wizard.written.length > 0}
    <ul class="written" aria-label={m.wizard_written_said()}>
      {#each wizard.written as line, at (at)}
        <li><Said text={line} /></li>
      {/each}
    </ul>
  {:else}
    <p class="prose"><Said text={m.wizard_written_unknown()} /></p>
  {/if}

  <ul class="ways">
    {#each everyRecovery as choice (choice)}
      <li>
        <Action
          label={titleOfRecovery(choice)}
          weight={choice === "resume" ? "firm" : undefined}
          off={busy}
          onclick={() => {
            choose(choice);
          }}
        />
        <p class="prose"><Said text={proseOfRecovery(choice)} /></p>
      </li>
    {/each}
  </ul>

  {#if forgetting}
    <div class="asked" role="status">
      <p class="prose"><Said text={m.wizard_start_over_confirm()} /></p>
      <div class="acts">
        <Action
          label={m.action_wizard_start_over_yes()}
          weight="firm"
          off={busy}
          onclick={() => {
            choose("start-over");
          }}
        />
        <Action
          label={m.action_leave_as_is()}
          onclick={() => {
            forgetting = false;
          }}
        />
      </div>
    </div>
  {/if}
</section>

<style>
  .recovering {
    display: grid;
    gap: var(--sp-4);
    justify-items: start;
    max-width: 68ch;
    overflow-wrap: anywhere;
  }

  h2 {
    margin: 0;
    font-size: var(--text-panel);
    font-weight: 600;
  }

  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
  }

  .written,
  .ways {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-prose);
  }

  .ways li {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-3);
    align-items: center;
  }

  .asked {
    display: grid;
    gap: var(--sp-2);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
