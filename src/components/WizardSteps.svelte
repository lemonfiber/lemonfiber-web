<script lang="ts">
  import WizardStep from "./WizardStep.svelte";
  import { standingAt, type Step } from "../lib/steps";

  interface Props {
    /** The steps, in the order they are taken. */
    steps: readonly Step[];
    /** Which of them is being done, counting from one. */
    current: number;
  }

  let { steps, current }: Props = $props();
</script>

<!--
  The whole run of steps, which is what makes each one of them true.

  A step's number, the count it is one of, and whether it is the one being
  done are all worked out here rather than given to a step to repeat. A rail
  therefore has exactly one current step, and its numbers cannot disagree with
  the order they are drawn in.

  It is also what lets a step know it is last: the line a step draws down to
  the next one is drawn by every step but the final sibling, and only a run
  holding all of them can put them side by side.
-->
<div class="vsteps">
  {#each steps as step, index (step.title)}
    <WizardStep
      position={index + 1}
      total={steps.length}
      title={step.title}
      detail={step.detail}
      standing={standingAt(index + 1, current)}
    />
  {/each}
</div>
