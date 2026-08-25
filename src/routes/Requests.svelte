<script lang="ts">
  import Board from "./Board.svelte";
  import DataTable from "../components/DataTable.svelte";
  import Panel from "../components/Panel.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import Value from "../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../lib/freshness";
  import { kindOfRequest, nameOfRequest, standingOf } from "../lib/household";
  import type { Column, Row } from "../lib/table";
  import type { Household, Member } from "../lib/wire";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What the household asked for, or why it could not be asked. */
    household: Reading<Household> | undefined;
    /** When this screen's source last answered. */
    freshness: Freshness;
  }

  let { household, freshness }: Props = $props();

  const columns: readonly Column[] = [
    { head: m.head_asked_for() },
    { head: m.head_where_it_stands() },
  ];

  const report = $derived(household?.ok === true ? household.value : undefined);
  const problem = $derived(
    household?.ok === false ? household.problem.message : undefined,
  );
  const members = $derived(report?.members);
  const unread = $derived(report?.findings ?? []);

  /**
   * Why the list of members is empty, or nothing where it is not empty.
   *
   * A record nobody could read and a household that has asked for nothing are
   * the same empty list and opposite facts, and the answer says which.
   */
  const nothing = $derived(said(report));

  function said(held: Household | undefined): string | undefined {
    if (held === undefined || held.members.length > 0) return undefined;
    return held.available ? m.requests_nobody() : m.requests_unread();
  }

  /** What one member asked for, newest first, as the table's rows. */
  function rows(member: Member): readonly Row[] {
    return member.requests.map((request, at): Row => ({
      kind: "answered",
      key: String(at),
      cells: [
        {
          kind: "words",
          text: nameOfRequest(request),
          caption: kindOfRequest(request),
          below: true,
          emphasis: "lead",
        },
        { kind: "words", text: standingOf(request) },
      ],
    }));
  }
</script>

<!--
  What each person in the house has asked for, and where each request stands.

  Where a request stands is a stage rather than a grading, so it is set in words
  and given no colour. Nobody has said that a request turned down wants the
  operator more than one still waiting for approval does, and a screen that
  tinted these would be assigning a severity the server never assigned.

  A member is a panel of their own. Whose request it is is the first thing read
  here, and one table with a column of names would say it once a row rather than
  once for the lot of them.

  What could not be read stands apart from what was. A record the request service
  would not give up is not one more request; it is the reason the list under it
  may be shorter than the truth.
-->
<Board>
  {#if members !== undefined && nothing === undefined}
    {#each members as member (member.name)}
      <Panel title={member.name} {freshness} flush>
        <DataTable label={member.name} {columns} rows={rows(member)} />
      </Panel>
    {/each}
  {:else if nothing !== undefined}
    <Panel title={m.nav_requests()} {freshness}>
      <Value state="unknown" absent={nothing} />
    </Panel>
  {:else if problem !== undefined}
    <Panel title={m.nav_requests()} {freshness}>
      <Value state="unknown" absent={problem} />
    </Panel>
  {:else}
    <Panel title={m.nav_requests()} {freshness}>
      <Skeleton width="16rem" label={m.waiting_answer()} />
    </Panel>
  {/if}

  {#if unread.length > 0}
    <Panel title={m.panel_unread()} {freshness}>
      <ul class="unread">
        {#each unread as finding, at (at)}
          <li><span class="word">{finding}</span></li>
        {/each}
      </ul>
    </Panel>
  {/if}
</Board>

<style>
  .unread {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
    max-width: 76ch;
  }

  li {
    font-size: var(--text-prose);
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
