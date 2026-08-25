<script lang="ts">
  import Banner from "../components/Banner.svelte";
  import Board from "./Board.svelte";
  import Findings from "./panels/Findings.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../lib/freshness";
  import type { Tone } from "../lib/state";
  import { gradingOf, toneOfOverall, type Grading } from "../lib/verdict";
  import type { Diagnosis, Overall } from "../lib/wire";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What the checks found, or why they could not be asked. */
    diagnosis: Reading<Diagnosis> | undefined;
    /** When this screen's source last answered. */
    freshness: Freshness;
  }

  let { diagnosis, freshness }: Props = $props();

  /** The run's own grading, and how loudly it is drawn. */
  const graded = $derived(
    diagnosis?.ok === true ? banner(diagnosis.value.overall) : undefined,
  );

  /** What the banner says for a grading, and the weight it says it with. */
  function banner(overall: Overall): Grading & { readonly tone: Tone } {
    return { ...gradingOf(overall), tone: toneOfOverall(overall) };
  }
</script>

<!--
  What every check found, and what the run of them came to.

  The banner is the run's own grading rather than a reading of the findings
  below it. Counting failures here would be a second grading competing with the
  server's, and the two would disagree the moment a check stops being counted
  the way this page counts it.

  A run nobody has answered yet has no grading, so there is no banner — an empty
  one would be a claim about a run that has not happened.
-->
<Board>
  {#if graded !== undefined}
    <Banner tone={graded.tone} lead={graded.lead} prose={graded.prose} />
  {/if}

  <Findings
    {diagnosis}
    {freshness}
    title={m.panel_findings()}
    absent={m.checks_none()}
  />
</Board>
