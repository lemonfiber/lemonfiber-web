<script lang="ts">
  import DataTable from "../../components/DataTable.svelte";
  import Panel from "../../components/Panel.svelte";
  import PersonRow from "../../components/PersonRow.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Freshness } from "../../lib/freshness";
  import {
    saidOfPolicy,
    shownOf,
    waitingOn,
    type Outstanding,
  } from "../../lib/household";
  import type { State } from "../../lib/state";
  import type { Column, Row } from "../../lib/table";
  import { reasonOf, type Folk, type House } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Who is in the house, as the stream last read them. */
    household: Folk | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { household, freshness }: Props = $props();

  const columns: readonly Column[] = [
    { head: m.head_who_asked() },
    { head: m.head_asked_for() },
    { head: m.head_where_it_stands() },
  ];

  const shown = $derived(
    household?.panel === "ready" ? household.data : undefined,
  );
  const reason = $derived(reasonOf(household));
  const allows = $derived(shown?.allows ?? undefined);
  const filtering = $derived(shown?.filtering ?? undefined);

  /**
   * Why nobody is listed, or nothing where somebody is.
   *
   * A house nothing could be read from and a house nobody lives in are the same
   * empty list and opposite facts, so the answer says which and carries how
   * much it can be stood behind.
   */
  const nothing = $derived(said(shown));

  /** Why the list is empty, and how much the answer can be trusted. */
  interface Empty {
    readonly state: State;
    readonly absent: string;
  }

  function said(read: House | undefined): Empty | undefined {
    if (read === undefined || read.members.length > 0) return undefined;
    return read.available
      ? { state: "known", absent: m.household_nobody() }
      : { state: "unknown", absent: m.household_unread() };
  }

  /** Everything waiting on the operator, as the table's rows. */
  function rows(waiting: readonly Outstanding[]): readonly Row[] {
    return waiting.map((one): Row => ({
      kind: "answered",
      key: one.key,
      cells: [
        { kind: "words", text: one.who },
        {
          kind: "words",
          text: one.what,
          caption: one.kind,
          below: true,
          emphasis: "lead",
        },
        { kind: "words", text: one.standing, caption: one.since },
      ],
    }));
  }
</script>

<!--
  Who is in the house, what happens to what they ask for, and everything they
  have asked for that nobody has finished ruling on.

  What is waiting on the operator comes before who is in the house. A request
  nobody has ruled on and one that failed after somebody did are the two nobody
  in the house can move on their own, and an operator who has to think to ask
  about them is one who finds out when somebody comes to complain.

  Where a person stands against what their period allows is one word rather than
  two counts. The request service keeps films and television apart and counts
  television a season at a time, so a folded figure would report a house as
  within its limit while the half that matters is spent.

  What the limits on this house are and are not is carried in the request
  service's own sentence, above the people it is about. A parent who has set a
  limit is the reader most likely to take it for a lock.

  What a request would cost, what was said when one was turned down, and what a
  member would be told are read on the requests screen. This panel is the
  operator's summary of what is not moving.

  What could not be read stands apart from what was. A record the request
  service would not give up is not one more person; it is the reason the list
  above it may be shorter than the truth.
-->
{#snippet unfilled()}
  <Value state="unknown" absent={reason} />
{/snippet}

<Panel
  title={m.panel_household()}
  {freshness}
  flush={shown !== undefined}
  dead={reason === undefined ? undefined : unfilled}
>
  {#if shown !== undefined}
    {@const waiting = waitingOn(shown.members)}
    <div class="says">
      <p class="prose">
        <span class="word">{saidOfPolicy(shown.policy)}</span>
      </p>
      {#if allows !== undefined}
        <p class="quiet">
          <span class="word">{m.household_allows({ allows })}</span>
        </p>
      {/if}
      {#if filtering !== undefined}
        <p class="quiet"><span class="word">{filtering}</span></p>
      {/if}
    </div>

    {#if nothing === undefined}
      <p class="eyebrow">
        <span class="word">{m.household_waiting_on_you()}</span>
      </p>
      {#if waiting.length > 0}
        <DataTable
          label={m.household_waiting_on_you()}
          {columns}
          rows={rows(waiting)}
        />
      {:else}
        <div class="says">
          <Value state="known" absent={m.household_nothing_waiting()} />
        </div>
      {/if}

      <p class="eyebrow"><span class="word">{m.household_members()}</span></p>
      <div class="people">
        {#each shown.members as person (person.name)}
          {@const read = shownOf(person)}
          <PersonRow
            name={read.name}
            tag={read.tag}
            prose={read.prose}
            quota={read.quota}
          />
        {/each}
      </div>
    {:else}
      <div class="says">
        <Value {...nothing} />
      </div>
    {/if}

    {#if shown.findings.length > 0}
      <p class="eyebrow"><span class="word">{m.panel_unread()}</span></p>
      <ul class="unread">
        {#each shown.findings as finding, at (at)}
          <li><span class="word">{finding}</span></li>
        {/each}
      </ul>
    {/if}
  {:else}
    <Skeleton width="18rem" label={m.waiting_answer()} />
  {/if}
</Panel>

<style>
  .says {
    padding: var(--sp-4) var(--panel-pad);
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .people {
    padding: 0 var(--panel-pad);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  .prose {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .quiet {
    margin: var(--sp-1) 0 0;
    font-size: var(--text-note);
    color: var(--faint);
    max-width: 76ch;
  }

  .eyebrow {
    margin: 0;
    padding: var(--sp-3) var(--panel-pad) var(--sp-2);
    border-top: 1px solid var(--line);
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--faint);
  }

  .unread {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding: 0 var(--panel-pad) var(--sp-4);
    list-style: none;
    max-width: 76ch;
  }

  li {
    font-size: var(--text-prose);
    color: var(--muted);
    overflow-wrap: anywhere;
  }
</style>
