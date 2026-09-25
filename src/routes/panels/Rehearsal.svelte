<script lang="ts">
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { bytes } from "../../lib/figures";
  import type { Freshness } from "../../lib/freshness";
  import {
    namesOf,
    wordOfNeed,
    type Forms,
    type Preview,
    type Stack,
  } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Every form the stack declares, which is where their names come from. */
    forms: Reading<Forms> | undefined;
    /** The forms the operator chose, by the id the listing gave them. */
    chosen: readonly string[];
    /** What starting the one form chosen would come to, or why not. */
    preview: Reading<Preview> | undefined;
    /** What each service is doing, which is where their names come from. */
    programs: Reading<Stack> | undefined;
    /** When the preview last answered. */
    freshness: Freshness;
  }

  let { forms, chosen, preview, programs, freshness }: Props = $props();

  /** One MiB, in bytes. */
  const MEBIBYTE = 1024 * 1024;

  const declared = $derived(forms?.ok === true ? forms.value.forms : undefined);
  const services = $derived(
    programs?.ok === true ? programs.value.services : undefined,
  );
  const plan = $derived(preview?.ok === true ? preview.value : undefined);
  const problem = $derived(
    preview?.ok === false ? preview.problem.message : undefined,
  );

  /** The names of the forms named here, as one run of words. */
  function named(ids: readonly string[]): string {
    return namesOf(ids, declared).join(", ");
  }

  /** What the estimate says, where the stack declared any of it. */
  function estimate(of: Preview): string | undefined {
    const { estimated_mib, unestimated } = of.footprint;
    if (estimated_mib === 0 && unestimated.length > 0) return undefined;
    return m.rehearsal_estimate({ size: bytes(estimated_mib * MEBIBYTE) });
  }
</script>

<!--
  What starting the form chosen would come to, said before anything starts.

  Drawn from what lemonfiber answers when the form is named to its forms read:
  the services that would start, the services the configuration would leave out
  with what each needs and which forms asked for it, and the memory the stack
  estimates they need. The first line says nothing has started, so none of it is
  read as having happened.

  The memory is the stack's estimate, summed from what its services declare,
  and is said as one. A figure set on its own would read as a measurement of
  something running, and nothing is. A service that declares no estimate is
  named rather than counted as nothing, and where none of them declares one
  there is no figure at all rather than a zero.

  One form at a time. A choice of several is said to be one this panel does not
  answer, rather than answered for one of them.
-->
<Panel title={m.panel_rehearsal()} {freshness}>
  {#if chosen.length === 0}
    <Value state="unknown" absent={m.rehearsal_choose()} />
  {:else if chosen.length > 1}
    <Value state="unknown" absent={m.rehearsal_one_at_a_time()} />
  {:else if plan !== undefined}
    {@const figure = estimate(plan)}
    <p class="lead">{m.rehearsal_lead({ form: named(plan.forms) })}</p>

    <p class="eyebrow">{m.rehearsal_would_start()}</p>
    {#if plan.services.length > 0}
      <ul class="listed">
        {#each namesOf(plan.services, services) as name, at (at)}
          <li><span class="named">{name}</span></li>
        {/each}
      </ul>
    {:else}
      <p class="prose">{m.rehearsal_nothing_starts()}</p>
    {/if}

    {#if plan.filtered.length > 0}
      <p class="eyebrow">{m.rehearsal_would_leave_out()}</p>
      <ul class="listed">
        {#each plan.filtered as one (one.id)}
          <li>
            <span class="named">{one.name}</span>
            <span class="because">{wordOfNeed(one.needs)}</span>
            <span class="because">
              {m.programs_asked_by({ forms: named(one.forms) })}
            </span>
          </li>
        {/each}
      </ul>
    {/if}

    <p class="eyebrow">{m.rehearsal_memory()}</p>
    <p class="prose">{figure ?? m.rehearsal_no_estimate()}</p>
    {#if plan.footprint.unestimated.length > 0}
      <p class="prose">{m.rehearsal_unestimated()}</p>
      <ul class="listed">
        {#each namesOf(plan.footprint.unestimated, services) as name, at (at)}
          <li><span class="named">{name}</span></li>
        {/each}
      </ul>
    {/if}
  {:else if problem !== undefined}
    <Value state="unknown" absent={problem} />
  {:else}
    <Skeleton width="12rem" label={m.waiting_answer()} />
  {/if}
</Panel>

<style>
  .lead {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
    max-width: 76ch;
  }

  .eyebrow {
    margin: var(--sp-4) 0 var(--sp-2);
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--faint);
  }

  .listed {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
    max-width: 76ch;
  }

  .named {
    font-size: var(--text-item);
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .because {
    display: block;
    font-size: var(--text-prose);
    color: var(--muted);
  }

  .prose {
    margin: 0 0 var(--sp-2);
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }
</style>
