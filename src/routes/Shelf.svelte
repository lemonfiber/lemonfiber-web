<script lang="ts">
  import Board from "./Board.svelte";
  import Action from "../components/Action.svelte";
  import DataTable from "../components/DataTable.svelte";
  import Panel from "../components/Panel.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import Value from "../components/Value.svelte";
  import type { Heard } from "../api/member";
  import type { Freshness } from "../lib/freshness";
  import type { Column, Row } from "../lib/table";
  import type { Access } from "../lib/wire";
  import { mediumOf, watchOf, type Holding, type Shelf } from "../lib/yours";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What the member signed in may watch, as lemonfiber answered it this time. */
    access: Heard<readonly Access[]> | undefined;
    /** When that answer came. */
    watched: Freshness;
    /** What the household holds, as the media server shows it to them. */
    shelf: Heard<Shelf> | undefined;
    /** When the shelf was answered. */
    freshness: Freshness;
    /** Ask again, where something could not be read. */
    onretry?: (() => void) | undefined;
  }

  let { access, watched, shelf, freshness, onretry }: Props = $props();

  const columns: readonly Column[] = [
    { head: m.member_head_title() },
    { head: m.member_head_kind() },
  ];

  /** What they may watch, where it was answered and says anything. */
  const limits = $derived(
    access?.at === "answered" && access.value.length > 0
      ? access.value
      : undefined,
  );

  /** The shelf, where it was answered and could be read. */
  const held = $derived(
    shelf?.at === "answered" && shelf.value.available ? shelf.value : undefined,
  );

  /** Everything on the shelf, as the table's rows. */
  function rows(holdings: readonly Holding[]): readonly Row[] {
    return holdings.map((holding): Row => {
      const year = holding.year ?? undefined;
      return {
        kind: "answered",
        key: holding.id,
        cells: [
          {
            kind: "words",
            text: holding.title,
            caption: year === undefined ? undefined : String(year),
            emphasis: "lead",
          },
          { kind: "words", text: mediumOf(holding.medium) },
        ],
      };
    });
  }
</script>

<!--
  What a household member can watch, and what the household holds that they can.

  Both are what lemonfiber answered this time and nothing else. The shelf is
  what the media server shows this member, with their limits already applied by
  the server, so a title a limit hides is never here to be hidden again — and
  nothing on this page decides that for itself.

  Neither is kept past the answer it came in. A shelf or a limit from before an
  asking that went unanswered would be a second copy of what somebody may watch,
  so an unanswered asking is said as unread and nothing from earlier stands in,
  with a way to ask again.
-->
<Board>
  <Panel stamped="quiet" title={m.member_watch_title()} freshness={watched}>
    {#if limits !== undefined}
      {#each limits as one, at (at)}
        {#each watchOf(one) as line, said (said)}
          <p class="line"><span class="word">{line}</span></p>
        {/each}
      {/each}
    {:else if access === undefined}
      <Skeleton width="16rem" label={m.waiting_answer()} />
    {:else}
      <Value
        state="unknown"
        absent={access.at === "declined"
          ? access.said
          : m.member_watch_unread()}
      />
      {#if onretry !== undefined}
        <div class="again">
          <Action label={m.action_try_again()} onclick={onretry} />
        </div>
      {/if}
    {/if}
  </Panel>

  <Panel
    stamped="quiet"
    title={m.member_shelf_title()}
    {freshness}
    flush={held !== undefined && held.holdings.length > 0}
  >
    {#if held !== undefined && held.holdings.length > 0}
      <DataTable
        label={m.member_shelf_title()}
        {columns}
        rows={rows(held.holdings)}
      />
    {:else if held !== undefined}
      <Value state="known" absent={m.member_shelf_empty()} />
    {:else if shelf === undefined}
      <Skeleton width="16rem" label={m.waiting_answer()} />
    {:else}
      <Value
        state="unknown"
        absent={shelf.at === "declined" ? shelf.said : m.member_shelf_unread()}
      />
      {#if onretry !== undefined}
        <div class="again">
          <Action label={m.action_try_again()} onclick={onretry} />
        </div>
      {/if}
    {/if}
  </Panel>
</Board>

<style>
  .line {
    margin: 0;
    max-width: 62ch;
    font-size: var(--text-prose);
    color: var(--text);
  }

  .line + .line {
    margin-top: var(--sp-2);
  }

  .again {
    margin-top: var(--sp-3);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
