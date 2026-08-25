<script lang="ts">
  import DataTable from "../../components/DataTable.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import StateTag from "../../components/StateTag.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import type { Column, Row } from "../../lib/table";
  import { stateOfService, type Stack } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What each service is doing, or why it could not be asked. */
    programs: Reading<Stack> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { programs, freshness }: Props = $props();

  const columns: readonly Column[] = [
    { head: m.head_program() },
    { head: m.head_state(), kind: "control" },
  ];

  const services = $derived(
    programs?.ok === true ? programs.value.services : undefined,
  );
  const problem = $derived(
    programs?.ok === false ? programs.problem.message : undefined,
  );
  const listed = $derived(services !== undefined && services.length > 0);
</script>

<!--
  Every service the reading names, and what each of them is doing.

  The tag in the second column is one of five drawings, so the five are declared
  once and a row reaches for the one its state names. A cell takes a snippet
  that is given nothing, which is what a row of a table can supply from data.
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
  {#if services !== undefined && listed}
    <DataTable
      label={m.panel_programs()}
      {columns}
      rows={services.map((service): Row => ({
        kind: "answered",
        key: service.id,
        cells: [
          { kind: "words", text: service.name, emphasis: "lead" },
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
</Panel>
