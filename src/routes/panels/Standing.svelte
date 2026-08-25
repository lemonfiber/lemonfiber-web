<script lang="ts">
  import BigFigure from "../../components/BigFigure.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { tally } from "../../lib/figures";
  import type { Freshness } from "../../lib/freshness";
  import {
    stateOfStanding,
    toneOfStanding,
    wordOfCondition,
    wordOfStanding,
    type Health,
    type Stack,
  } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the whole stack amounts to, or why it could not be asked. */
    stack: Reading<Stack> | undefined;
    /** The newest grading the stream delivered. */
    health: Health | undefined;
    /** When this panel's sources last answered. */
    freshness: Freshness;
  }

  let { stack, health, freshness }: Props = $props();

  const condition = $derived(
    stack?.ok === true ? wordOfCondition(stack.value.condition) : undefined,
  );
  const problem = $derived(
    stack?.ok === false ? stack.problem.message : undefined,
  );
</script>

<!--
  The one line the whole screen is graded by, and the clause the reading of what
  is running sets beside it.

  Two sources fill one panel, and the count is the one that may be missing: the
  reading answers once and the stream keeps grading, so a screen that has been
  answered and not yet graded says what is running and says plainly that nothing
  has counted what is wrong with it.
-->
<Panel title={m.panel_standing()} {freshness}>
  {#if health !== undefined}
    <BigFigure
      state={stateOfStanding(health.standing)}
      figure={tally(health.wanting_attention)}
      absent={m.value_not_known()}
      eyebrow={m.eyebrow_wrong()}
      beside={condition}
      caption={health.worst ?? wordOfStanding(health.standing)}
      alarm={toneOfStanding(health.standing) === "alarm"}
    />
  {:else if stack?.ok === true}
    <BigFigure
      state="unknown"
      absent={m.waiting_answer()}
      eyebrow={m.eyebrow_wrong()}
      beside={condition}
    />
  {:else if problem !== undefined}
    <Value state="unknown" absent={problem} />
  {:else}
    <Skeleton width="9rem" label={m.waiting_answer()} />
  {/if}
</Panel>
