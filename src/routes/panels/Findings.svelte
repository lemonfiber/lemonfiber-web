<script lang="ts">
  import Panel from "../../components/Panel.svelte";
  import Port from "../../components/Port.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Tag from "../../components/Tag.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import type { Tone } from "../../lib/state";
  import {
    accountOf,
    toneOfOutcome,
    wordOfCategory,
    wordOfOutcome,
  } from "../../lib/verdict";
  import type { Diagnosis, Finding } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the checks found, or why they could not be asked. */
    diagnosis: Reading<Diagnosis> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
    /** The heading, which says which checks these are. */
    title: string;
    /** What is said where the run produced no finding at all. */
    absent: string;
  }

  let { diagnosis, freshness, title, absent }: Props = $props();

  /** One thing to do about a finding, as the row sets it out. */
  interface Doing {
    /** The action, phrased as something to do. */
    readonly action: string;
    /** Where to look, where saying so helps. */
    readonly detail: string | undefined;
  }

  /** One finding, and everything the row sets out for it. */
  interface Shown {
    /** How it turned out, in one word. */
    readonly word: string;
    /** How badly it wants the operator. */
    readonly tone: Tone;
    /** The family the check belongs to. */
    readonly family: string;
    /** What was checked. */
    readonly title: string;
    /** What was seen, or what could not be. */
    readonly summary: string | undefined;
    /** What it means for the operator. */
    readonly meaning: string | undefined;
    /** What to do, most likely first. */
    readonly doings: readonly Doing[];
    /** Which service it is about, where it is about one. */
    readonly about: string | undefined;
    /** The check whose finding explains this one, where another does. */
    readonly caused: string | undefined;
    /** What the service said for itself, where it said anything. */
    readonly output: string | undefined;
  }

  const shown = $derived(
    diagnosis?.ok === true ? diagnosis.value.findings.map(read) : undefined,
  );
  const problem = $derived(
    diagnosis?.ok === false ? diagnosis.problem.message : undefined,
  );
  const listed = $derived(shown !== undefined && shown.length > 0);

  /**
   * What one finding sets out: how it turned out, what it is about, and
   * everything it said for itself.
   */
  function read(finding: Finding): Shown {
    const outcome = finding.verdict.outcome;
    const account = accountOf(finding.verdict);
    const service = finding.service ?? undefined;
    const caused = finding.caused_by ?? undefined;

    return {
      word: wordOfOutcome(outcome),
      tone: toneOfOutcome(outcome),
      family: wordOfCategory(finding.category),
      title: finding.title,
      summary: account.summary,
      meaning: account.meaning,
      doings: account.remedies.map((remedy) => ({
        action: remedy.action,
        detail: remedy.detail ?? undefined,
      })),
      about: service === undefined ? undefined : m.finding_about({ service }),
      caused:
        caused === undefined
          ? undefined
          : m.finding_explained_by({ check: caused }),
      output: spoken(finding.said ?? undefined),
    };
  }

  /** A service's own words, or nothing where it wrote none worth showing. */
  function spoken(said: string | undefined): string | undefined {
    const words = said?.trim();
    return words === undefined || words === "" ? undefined : words;
  }
</script>

<!--
  Every check that ran, in the order the checks produced them, and how each one
  turned out.

  A finding's outcome is the server's own word and is set out as a tag rather
  than as one of the five gradings of trust: a check that could not run is not a
  figure nobody has measured, and announcing it as one answers a different
  question. The family beside it carries no severity at all, so what weight a
  row has comes from the one tag that has any.

  What the service said for itself is carried through unchanged and wraps rather
  than scrolls. An operator reading a permission denial has the whole of it, and
  a page that went sideways to show it would cost them the rest of the screen.
-->
<Panel {title} {freshness} flush={listed}>
  {#if shown !== undefined && listed}
    {#each shown as one, at (at)}
      <article class="finding" class:alarm={one.tone === "alarm"}>
        <Port tone={one.tone} />
        <div class="what">
          <p class="marks">
            <Tag label={one.word} tone={one.tone} />
            <Tag label={one.family} />
            {#if one.about !== undefined}
              <span class="about">{one.about}</span>
            {/if}
          </p>
          <h3>{one.title}</h3>
          {#if one.summary !== undefined}
            <p class="prose">{one.summary}</p>
          {/if}
          {#if one.meaning !== undefined}
            <p class="prose">{one.meaning}</p>
          {/if}
          {#if one.doings.length > 0}
            <p class="eyebrow">{m.finding_to_do()}</p>
            <ul class="todo">
              {#each one.doings as doing, which (which)}
                <li>
                  <span class="act">{doing.action}</span>
                  {#if doing.detail !== undefined}
                    <span class="detail">{doing.detail}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
          {#if one.caused !== undefined}
            <p class="quiet">{one.caused}</p>
          {/if}
          {#if one.output !== undefined}
            <p class="eyebrow">{m.finding_said()}</p>
            <pre class="output">{one.output}</pre>
          {/if}
        </div>
      </article>
    {/each}
  {:else if shown !== undefined}
    <Value state="known" {absent} />
  {:else if problem !== undefined}
    <Value state="unknown" absent={problem} />
  {:else}
    <Skeleton width="18rem" label={m.waiting_answer()} />
  {/if}
</Panel>

<style>
  .finding {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--sp-4);
    align-items: start;
    padding: var(--sp-4) var(--panel-pad);
    background: var(--paper);
    border-bottom: 1px solid var(--line);
  }

  .finding:last-child {
    border-bottom: 0;
  }

  /* Only the rows that want the operator take a ground of their own. A warning
     carries its weight in the tag and the tile, which is enough for a row that
     is not asking to be acted on now. */
  .alarm {
    background: var(--alarm-tint);
  }

  /* Every word a check or a service wrote is set here, and a run with nothing
     to break on — a check name, a path, a hash — is broken at the edge rather
     than taken sideways off the page. Set once on what holds them, since
     breaking is inherited. */
  .what {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  /* The tags and the service the finding is about read as one line, and wrap
     onto a second rather than running out of the row. */
  .marks {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-tight);
    margin: 0 0 var(--sp-2);
  }

  .about {
    font-size: var(--text-note);
    color: var(--faint);
  }

  h3 {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-item);
    font-weight: 600;
  }

  .prose {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .eyebrow {
    margin: var(--sp-3) 0 var(--sp-1);
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--faint);
  }

  .todo {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
    max-width: 76ch;
  }

  li {
    font-size: var(--text-prose);
  }

  .act {
    font-weight: 600;
  }

  .detail {
    display: block;
    color: var(--faint);
    font-size: var(--text-note);
  }

  .quiet {
    margin: var(--sp-2) 0 0;
    font-size: var(--text-note);
    color: var(--faint);
  }

  /* An alarm row stands on a tint rather than on the panel's own ground, and
     the faint step of the ink scale holds 4.38:1 against that tint in both dark
     palettes — under the 4.5:1 small text owes. On that ground the quiet step is
     the muted one, which holds in every palette. */
  .alarm .about,
  .alarm .eyebrow,
  .alarm .detail,
  .alarm .quiet {
    color: var(--muted);
  }

  /* A service's own words, kept as it set them and wrapped rather than cut. A
     run with nothing to break on is broken at the edge, which keeps a path or a
     hash inside the panel instead of taking the page sideways with it. */
  .output {
    margin: 0;
    padding: var(--sp-2) var(--sp-3);
    background: var(--pith);
    border-radius: var(--r-sm);
    font-family: var(--mono);
    font-size: var(--text-note);
    color: var(--muted);
    white-space: pre-wrap;
  }
</style>
