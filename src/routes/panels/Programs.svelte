<script lang="ts">
  import DataTable from "../../components/DataTable.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import StateTag from "../../components/StateTag.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import type { Column, Row } from "../../lib/table";
  import {
    namesOf,
    servicesOf,
    stateOfService,
    wordOfNeed,
    type Forms,
    type Stack,
  } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What each service is doing, or why it could not be asked. */
    programs: Reading<Stack> | undefined;
    /**
     * Every form the stack declares, which is where the names of the forms a
     * service runs for come from.
     */
    forms: Reading<Forms> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { programs, forms, freshness }: Props = $props();

  const columns: readonly Column[] = [
    { head: m.head_program() },
    { head: m.head_forms() },
    { head: m.head_state(), kind: "control" },
  ];

  const reading = $derived(programs?.ok === true ? programs.value : undefined);
  const services = $derived(
    reading === undefined ? undefined : servicesOf(reading),
  );
  const declared = $derived(forms?.ok === true ? forms.value.forms : undefined);
  const running = $derived(
    reading === undefined ? undefined : namesOf(reading.active_forms, declared),
  );
  const left = $derived(reading?.filtered ?? []);
  const problem = $derived(
    programs?.ok === false ? programs.problem.message : undefined,
  );
  const listed = $derived(services !== undefined && services.length > 0);
  const cannot = $derived(reading?.unsupported ?? []);

  /** The names of the forms named here, as one run of words. */
  function named(ids: readonly string[]): string {
    return namesOf(ids, declared).join(", ");
  }
</script>

<!--
  Every service the reading names, what each of them is doing, and the forms it
  is running for.

  The forms running stand above the table, so the table is read as what those
  forms came to. A service two of them share is one row naming both, since it is
  one service, and stopping one of the two leaves it running for the other.

  The tag in the last column is one of five drawings, so the five are declared
  once and a row reaches for the one its state names. A cell takes a snippet
  that is given nothing, which is what a row of a table can supply from data.

  Under the table stand the services the forms asked for and the configuration
  left out, each with what it would need and which forms asked for it. They are
  kept out of the table rather than drawn in it as stopped: a service left out
  on purpose is the operator's own setting being honoured, and a row saying it
  is down would report that setting as a fault.

  Last stand the services lemonfiber runs and can do less with, each with why.
  They start, stop and report their state like any other, so the table says
  nothing about them that is not also true of the rest; what is missing is the
  work that needs to know what a service is. Left out, such a service reads as
  one lemonfiber simply forgot, and the operator who wrote the declaration it
  could not follow has nothing to go on.
-->
{#snippet asKnown()}
  <StateTag state="known" />
{/snippet}
{#snippet asQuiet()}
  <StateTag state="quiet" />
{/snippet}
{#snippet asUnknown()}
  <StateTag state="unknown" />
{/snippet}
{#snippet asStopped()}
  <StateTag state="stopped" />
{/snippet}
{#snippet asPart()}
  <StateTag state="part" />
{/snippet}

<Panel title={m.panel_programs()} {freshness} flush={listed}>
  {#if running !== undefined}
    <div class="running" class:inset={!listed}>
      <p class="eyebrow">{m.programs_forms_running()}</p>
      {#if running.length > 0}
        <ul class="forms">
          {#each running as name, at (at)}
            <li><span class="named">{name}</span></li>
          {/each}
        </ul>
      {:else}
        <p class="none">{m.programs_forms_none()}</p>
      {/if}
    </div>
  {/if}

  {#if services !== undefined && listed}
    <DataTable
      label={m.panel_programs()}
      {columns}
      rows={services.map((service): Row => ({
        kind: "answered",
        key: service.id,
        cells: [
          { kind: "words", text: service.name, emphasis: "lead" },
          service.forms.length > 0
            ? { kind: "words", text: named(service.forms) }
            : { kind: "words", text: m.programs_no_form(), emphasis: "quiet" },
          {
            kind: "drawn",
            draw: {
              known: asKnown,
              quiet: asQuiet,
              unknown: asUnknown,
              stopped: asStopped,
              part: asPart,
            }[stateOfService(service.state)],
          },
        ],
      }))}
    />
  {:else if services !== undefined}
    <Value state="unknown" absent={m.programs_none()} />
  {:else if problem !== undefined}
    <Value state="unknown" absent={problem} />
  {:else}
    <Skeleton width="12rem" label={m.waiting_answer()} />
  {/if}

  {#if left.length > 0}
    <div class="aside">
      <p class="eyebrow">{m.programs_left_out()}</p>
      <p class="prose">{m.programs_left_out_prose()}</p>
      <ul class="listed">
        {#each left as one (one.id)}
          <li>
            <span class="named">{one.name}</span>
            <span class="because">{wordOfNeed(one.needs)}</span>
            <span class="because">
              {m.programs_asked_by({ forms: named(one.forms) })}
            </span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if cannot.length > 0}
    <div class="aside">
      <p class="eyebrow">{m.programs_less()}</p>
      <ul class="listed">
        {#each cannot as one, at (at)}
          <li>
            <span class="named">{one.what}</span>
            <span class="because">{one.because}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</Panel>

<style>
  /* The panel is flush for the table, so this states the inset the table rows
     carry for themselves, and a rule sets it apart from the first of them. */
  .running {
    padding: var(--sp-4) var(--panel-pad);
    border-bottom: 1px solid var(--line);
  }

  /* Without the table the panel sets its own inset, and nothing sits under the
     line for the rule to part it from. */
  .running.inset {
    padding: 0 0 var(--sp-4);
    border-bottom: none;
  }

  /* The panel is flush for the table above, so this states the inset the table
     rows carry for themselves, and a rule sets it apart from the last of them. */
  .aside {
    padding: var(--sp-4) var(--panel-pad);
    border-top: 1px solid var(--line);
  }

  .forms {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .none,
  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .prose {
    margin-bottom: var(--sp-3);
  }

  .eyebrow {
    margin: 0 0 var(--sp-2);
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
</style>
