<script lang="ts">
  import DataTable from "../../components/DataTable.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Tag from "../../components/Tag.svelte";
  import Value from "../../components/Value.svelte";
  import {
    saidOfChosen,
    stateOfDoor,
    toneOfDoor,
    wordOfDoorStanding,
    wordOfFacing,
  } from "../../lib/door";
  import type { Freshness } from "../../lib/freshness";
  import type { Column, Row } from "../../lib/table";
  import { reasonOf, type Door, type Doorway } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The front door, as the stream last read it. */
    door: Doorway | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { door, freshness }: Props = $props();

  const columns: readonly Column[] = [
    { head: m.head_program() },
    { head: m.head_what_it_is_to_them() },
    { head: m.head_why_not_the_door() },
  ];

  const shown = $derived(door?.panel === "ready" ? door.data : undefined);
  const reason = $derived(reasonOf(door));
  const address = $derived(shown?.address ?? undefined);
  const service = $derived(shown?.service ?? undefined);
  const facing = $derived(shown?.facing ?? undefined);
  const caution = $derived(address?.caution ?? undefined);

  /** Everything else the house can reach, as the table's rows. */
  function rows(read: Door): readonly Row[] {
    return read.beside.map((one): Row => ({
      kind: "answered",
      key: one.service,
      cells: [
        { kind: "words", text: one.service, emphasis: "lead" },
        { kind: "words", text: wordOfFacing(one.facing) },
        { kind: "words", text: one.because },
      ],
    }));
  }
</script>

<!--
  The one address to hand somebody who lives here, and what else they can reach
  that is not it.

  The address stands apart from the standing above it. It is read off this
  machine at the moment of asking rather than remembered, so it is current
  whether or not the service behind it is answering — and a door that is down is
  exactly when an operator is being asked what to open. What the standing says
  is whether arriving there will work, which is a different fact and is set in
  its own tag.

  A door the operator named and this stack refused carries what they wrote and
  why it is not the door. An operator whose setting was refused reads that
  sentence and finds their own words in it, rather than a door they did not
  choose and no account of where theirs went.

  What else the house can reach is carried rather than left out. An operator
  shown a single name has been given an answer; one who can see that the index
  over every service was considered and refused has been told something.
-->
{#snippet unfilled()}
  <Value state="unknown" absent={reason} />
{/snippet}

<Panel
  title={m.panel_front_door()}
  {freshness}
  flush={shown !== undefined}
  dead={reason === undefined ? undefined : unfilled}
>
  {#if shown !== undefined}
    <div class="door">
      <p class="marks">
        <Tag
          label={wordOfDoorStanding(shown.standing)}
          tone={toneOfDoor(shown.standing)}
          state={stateOfDoor(shown.standing)}
        />
        {#if service !== undefined}
          <Tag label={service} />
        {/if}
        {#if facing !== undefined}
          <span class="what"
            ><span class="word">{wordOfFacing(facing)}</span></span
          >
        {/if}
      </p>

      <p class="address">
        <Value
          state="known"
          figure={address?.url}
          absent={m.door_no_address()}
        />
      </p>

      {#if caution !== undefined}
        <p class="caution"><span class="word">{caution}</span></p>
      {/if}

      <p class="prose"><span class="word">{shown.meaning}</span></p>
      <p class="quiet">
        <span class="word">{saidOfChosen(shown.chosen)}</span>
      </p>
    </div>

    {#if shown.beside.length > 0}
      <p class="eyebrow"><span class="word">{m.door_beside()}</span></p>
      <DataTable label={m.door_beside()} {columns} rows={rows(shown)} />
    {/if}
  {:else}
    <Skeleton width="16rem" label={m.waiting_answer()} />
  {/if}
</Panel>

<style>
  .door {
    padding: var(--sp-4) var(--panel-pad);
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  /* The standing, the service and what it is to the house read as one line,
     and wrap onto a second rather than running out of the panel. */
  .marks {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-tight);
    margin: 0 0 var(--sp-2);
  }

  .what {
    font-size: var(--text-note);
    color: var(--faint);
  }

  /* The one thing on this panel somebody reads out loud or types into another
     device, so it takes the size a row's own subject takes rather than the size
     of the sentence under it. */
  .address {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-item);
  }

  /* A caption on the address rather than a line of its own: what it says is
     about the address it sits under. */
  .caution {
    margin: 0 0 var(--sp-2);
    font-size: var(--text-note);
    color: var(--faint);
    max-width: 76ch;
  }

  .prose {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .quiet {
    margin: 0;
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
</style>
