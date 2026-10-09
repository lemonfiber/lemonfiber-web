<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Said from "../../components/Said.svelte";
  import Value from "../../components/Value.svelte";
  import WizardSteps from "../../components/WizardSteps.svelte";
  import Answering from "./Answering.svelte";
  import {
    asks,
    plannedLine,
    proofLine,
    proseOfStep,
    stepsAhead,
    titleOfStep,
    unproven,
    type Answer,
    type Move,
    type Proving,
    type Wizard,
  } from "../../lib/wizard";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Where setup stands. */
    wizard: Wizard;
    /** Whether a step is out, which silences every control. */
    busy: boolean;
    /** The credential the last answer carried, where it carried one. */
    proving: Proving | undefined;
    /** Take one step. */
    onmove: (move: Move) => void;
  }

  let { wizard, busy, proving, onmove }: Props = $props();

  const titleId = $props.id();

  const ahead = $derived(
    stepsAhead(wizard).map((step) => ({
      title: titleOfStep(step),
      detail: step === wizard.at ? m.wizard_step_now() : m.wizard_step_ahead(),
    })),
  );

  /** What proving the credential just given came to, where one was given. */
  const proved = $derived.by(() => {
    const { proof } = wizard;
    if (proof === undefined || proof === null || proving === undefined) {
      return undefined;
    }
    return { line: proofLine(proof, proving), again: unproven(proof) };
  });
</script>

<!--
  The step setup is on: what it is for, its form or its acknowledgement, and
  the steps still ahead, which a narrow screen counts rather than lists. Back
  sits first beside the step's own action. What proving a credential came to is said at the top
  of whichever step the answer moved on to, so the result is never lost when
  setup moves on; where it left the credential unproven, going back to enter
  it again is offered beside it. Review lists every setting apply will write,
  and nothing is written until it is said yes to.
-->
<div class="walking">
  <div class="rail"><WizardSteps steps={ahead} current={1} /></div>

  <section class="step" aria-labelledby={titleId}>
    {#if proved !== undefined}
      <div class="proved" role="status">
        <p><Said text={proved.line} /></p>
        {#if proved.again}
          <Action
            label={m.action_wizard_again()}
            off={busy}
            onclick={() => {
              onmove({ move: "back" });
            }}
          />
        {/if}
      </div>
    {/if}

    {#if ahead.length > 1}
      <p class="left">{m.wizard_steps_left({ count: ahead.length - 1 })}</p>
    {/if}
    <h2 id={titleId}>{titleOfStep(wizard.at)}</h2>
    <p class="prose"><Said text={proseOfStep(wizard.at)} /></p>

    {#if wizard.at === "review"}
      {#if wizard.plan.length > 0}
        <ul class="plan" aria-label={m.wizard_plan_said()}>
          {#each wizard.plan as setting (setting.key)}
            <li><Said text={plannedLine(setting)} /></li>
          {/each}
        </ul>
      {:else}
        <Value state="unknown" absent={m.wizard_plan_none()} />
      {/if}
      <div class="acts">
        <Action
          label={m.action_wizard_back()}
          off={busy}
          onclick={() => {
            onmove({ move: "back" });
          }}
        />
        <Action
          label={m.action_wizard_write()}
          weight="firm"
          off={busy || !wizard.ready_for_review}
          onclick={() => {
            onmove({ move: "apply" });
          }}
        />
      </div>
    {:else if asks(wizard.at)}
      {@const asking = wizard.at}
      {#key asking}
        <Answering
          step={asking}
          {busy}
          onback={() => {
            onmove({ move: "back" });
          }}
          onanswer={(answer: Answer) => {
            onmove({ move: "answer", answer });
          }}
        />
      {/key}
    {:else}
      <div class="acts">
        {#if wizard.at !== "welcome"}
          <Action
            label={m.action_wizard_back()}
            off={busy}
            onclick={() => {
              onmove({ move: "back" });
            }}
          />
        {/if}
        <Action
          label={m.action_wizard_continue()}
          weight="firm"
          off={busy}
          onclick={() => {
            onmove({ move: "next" });
          }}
        />
      </div>
    {/if}
  </section>
</div>

<style>
  .walking {
    display: grid;
    grid-template-columns: minmax(12rem, 16rem) 1fr;
    gap: var(--sp-6);
    align-items: start;
  }

  .step {
    display: grid;
    gap: var(--sp-4);
    justify-items: start;
    overflow-wrap: anywhere;
  }

  h2 {
    margin: 0;
    font-size: var(--text-unit);
    font-weight: 700;
  }

  .left {
    display: none;
    margin: 0;
    font-size: var(--text-control);
    color: var(--muted);
  }

  .prose,
  .proved p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 68ch;
  }

  .proved {
    display: grid;
    gap: var(--sp-2);
    justify-items: start;
    padding: var(--sp-3) var(--sp-4);
    border: 1px solid var(--line);
    border-radius: var(--r-md);
  }

  .plan {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-prose);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }

  /* Narrower than the rail and the question side by side, the rail would push
     the question below the fold, so the count of steps left stands in for it. */
  @media (max-width: 48rem) {
    .walking {
      grid-template-columns: 1fr;
    }

    .rail {
      display: none;
    }

    .left {
      display: block;
    }
  }
</style>
