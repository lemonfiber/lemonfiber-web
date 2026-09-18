<script lang="ts">
  import BigFigure from "../../components/BigFigure.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Tag from "../../components/Tag.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { tally } from "../../lib/figures";
  import type { Freshness } from "../../lib/freshness";
  import type { Tone } from "../../lib/state";
  import { toneOfSeverity, wordOfSeverity } from "../../lib/trouble";
  import {
    stateOfStanding,
    toneOfStanding,
    wordOfCondition,
    wordOfStanding,
    type Affected,
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

  /** One thing that is wrong, and everything the grading expands to for it. */
  interface Wrong {
    /** The check that raised it. */
    readonly check: string;
    /** How much it matters, in one word. */
    readonly weight: string;
    /** How badly it wants the operator. */
    readonly tone: Tone;
    /** What is wrong, in one line. */
    readonly summary: string;
    /** What it costs the operator, which is the half between the two. */
    readonly meaning: string;
    /** What to do about it, most likely first. */
    readonly remedies: readonly string[];
    /** What is also wrong because of this, counted with it rather than again. */
    readonly downstream: readonly string[];
  }

  const condition = $derived(
    stack?.ok === true ? wordOfCondition(stack.value.condition) : undefined,
  );
  const problem = $derived(
    stack?.ok === false ? stack.problem.message : undefined,
  );

  /** What the grading expands to for one of the things it counted. */
  function read(one: Affected): Wrong {
    return {
      check: one.check,
      weight: wordOfSeverity(one.severity),
      tone: toneOfSeverity(one.severity),
      summary: one.summary,
      meaning: one.meaning,
      remedies: one.remedies,
      downstream: one.downstream,
    };
  }
</script>

<!--
  The one line the whole screen is graded by, and the clause the reading of what
  is running sets beside it.

  Two sources fill one panel, and the count is the one that may be missing: the
  reading answers once and the stream keeps grading, so a screen that has been
  answered and not yet graded says what is running and says plainly that nothing
  has counted what is wrong with it.

  Under the figure is what the figure counted: each thing that is wrong, what to
  do about it, and what is also wrong because of it. A count on its own is a
  number nobody can act on, and the operator who reads it here is the one who
  would otherwise go looking for the rest of it elsewhere.

  What follows from a cause is set under that cause rather than beside it as a
  thing of its own, which is what the figure above did when it counted them:
  nine imports a full disk stopped are one thing wrong, and listing them as nine
  would make the expansion disagree with the figure it expands.
-->
<Panel title={m.panel_standing()} {freshness}>
  {#if health !== undefined}
    {@const wrong = health.affected.map(read)}
    <BigFigure
      state={stateOfStanding(health.standing)}
      figure={tally(health.wanting_attention)}
      absent={m.value_not_known()}
      eyebrow={m.eyebrow_wrong()}
      beside={condition}
      caption={health.worst ?? wordOfStanding(health.standing)}
      alarm={toneOfStanding(health.standing) === "alarm"}
    />
    {#if wrong.length > 0}
      <p class="eyebrow">{m.affected_lead()}</p>
      <ul class="wrong">
        {#each wrong as one, at (at)}
          <li class="one">
            <p class="marks">
              <Tag label={one.weight} tone={one.tone} />
              <span class="check">{one.check}</span>
            </p>
            <p class="prose">{one.summary}</p>
            <p class="prose">{one.meaning}</p>
            {#if one.remedies.length > 0}
              <p class="eyebrow">{m.finding_to_do()}</p>
              <ul class="listed">
                {#each one.remedies as action, which (which)}
                  <li><span class="word">{action}</span></li>
                {/each}
              </ul>
            {/if}
            {#if one.downstream.length > 0}
              <p class="eyebrow">{m.affected_follows()}</p>
              <ul class="listed">
                {#each one.downstream as check, which (which)}
                  <li><span class="check">{check}</span></li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
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

<style>
  .eyebrow {
    margin: var(--sp-4) 0 var(--sp-2);
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--faint);
  }

  .wrong {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Each thing wrong stands apart from the next by a rule rather than by a
     ground of its own: the figure above already carries the weight of the whole
     grading, and a column of tinted blocks under it would compete with it. */
  .one {
    padding-top: var(--sp-4);
    border-top: 1px solid var(--line);
  }

  .one:first-child {
    padding-top: 0;
    border-top: 0;
  }

  /* The weight and the check it came from read as one line, and wrap onto a
     second rather than running out of a panel that is half the page wide. */
  .marks {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-tight);
    margin: 0 0 var(--sp-2);
  }

  .check {
    font-family: var(--mono);
    font-size: var(--text-note);
    color: var(--faint);
    overflow-wrap: anywhere;
  }

  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
    overflow-wrap: anywhere;
  }

  /* The eyebrow under a thing wrong sits closer to it than the one that opens
     the list, which belongs to the figure above rather than to any one row. */
  .one .eyebrow {
    margin-top: var(--sp-3);
  }

  .listed {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
    max-width: 76ch;
    font-size: var(--text-prose);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
