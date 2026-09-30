<script lang="ts">
  import Board from "./Board.svelte";
  import Action from "../components/Action.svelte";
  import Banner from "../components/Banner.svelte";
  import DataTable from "../components/DataTable.svelte";
  import Panel from "../components/Panel.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import Value from "../components/Value.svelte";
  import type { Freshness } from "../lib/freshness";
  import {
    askingWasRead,
    kindOfRequest,
    nameOfRequest,
    standingOf,
  } from "../lib/household";
  import type { Column, Row } from "../lib/table";
  import type { Household, Member } from "../lib/wire";
  import { approvalOf, besideOf, leftOf } from "../lib/yours";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What lemonfiber last answered about the member signed in. */
    household: Household | undefined;
    /** When that answer came. */
    freshness: Freshness;
    /** Whether the latest asking went unanswered. */
    quiet: boolean;
    /**
     * What lemonfiber said when it declined the asking with the session still
     * standing, drawn in place of the words for a silence.
     */
    said?: string | undefined;
    /** What asking again asks for. Left out where nothing answers it. */
    onretry?: (() => void) | undefined;
  }

  let { household, freshness, quiet, said, onretry }: Props = $props();

  const columns: readonly Column[] = [
    { head: m.head_asked_for() },
    { head: m.head_where_it_stands() },
  ];

  /**
   * Whether the answer read nothing about them.
   *
   * A household the media server would not list and one it listed without
   * them are the same empty answer to a member, and neither is a member who
   * has asked for nothing.
   */
  const unread = $derived(
    household !== undefined &&
      (!household.available || household.members.length === 0),
  );

  /** Whether what they asked for was read, as against left unasked. */
  const read = $derived(askingWasRead(household?.policy));

  /** Before they ask: whether it waits for approval, and what is left. */
  function before(member: Member): readonly string[] {
    const asking = member.asking ?? undefined;
    if (asking === undefined) return [m.member_asking_unread()];
    return [approvalOf(asking), leftOf(asking)];
  }

  /** What they asked for, newest first, as the table's rows. */
  function rows(member: Member): readonly Row[] {
    return member.requests.map((request): Row => ({
      kind: "answered",
      key: String(request.id),
      cells: [
        {
          kind: "words",
          text: nameOfRequest(request),
          caption: kindOfRequest(request),
          below: true,
          emphasis: "lead",
        },
        {
          kind: "words",
          text: standingOf(request),
          caption: besideOf(request),
          below: true,
        },
      ],
    }));
  }
</script>

<!--
  What a household member asked for, and what happens when they ask.

  Before anything they asked for comes what asking does: whether it waits for
  somebody to approve it, and how much of their allowance is left. Both are what
  lemonfiber answered about them and nothing is worked out here.

  Where the latest asking went unanswered, what they asked for stays on the
  screen as it stood when lemonfiber last answered, stamped with how long it has
  been quiet, and nothing is said about asking beyond that it waits. A figure
  about allowance from before the silence is one nobody can stand behind.

  What lemonfiber could not read is said as that. An empty list is said as the
  first thing to do.
-->
{#snippet retry()}
  <Action label={m.action_try_again()} onclick={onretry} />
{/snippet}

<Board>
  {#if quiet}
    <Banner
      tone="watch"
      lead={m.member_unanswered_lead()}
      prose={said ??
        (household === undefined
          ? m.member_asking_declined()
          : m.member_unanswered_prose())}
      actions={onretry === undefined ? undefined : retry}
    />
  {/if}

  {#if household === undefined}
    <Panel title={m.room_asked()} {freshness}>
      {#if quiet}
        <Value state="unknown" absent={m.member_asked_unread()} />
      {:else}
        <Skeleton width="16rem" label={m.waiting_answer()} />
      {/if}
    </Panel>
  {:else if unread}
    <Panel title={m.room_asked()} {freshness}>
      <Value state="unknown" absent={m.member_asked_unread()} />
    </Panel>
  {:else}
    {#each household.members as member, at (at)}
      {@const asked = member.requests.length > 0}
      <Panel title={m.member_asking_title()} {freshness}>
        {#if quiet}
          <p class="line">
            <span class="word">{m.member_asking_declined()}</span>
          </p>
        {:else}
          {#each before(member) as line, one (one)}
            <p class="line"><span class="word">{line}</span></p>
          {/each}
        {/if}
      </Panel>
      <Panel title={m.room_asked()} {freshness} flush={asked}>
        {#if asked}
          <DataTable label={m.room_asked()} {columns} rows={rows(member)} />
        {:else if read}
          <p class="line"><span class="word">{m.member_asked_first()}</span></p>
        {:else}
          <Value state="unknown" absent={m.member_asked_unread()} />
        {/if}
      </Panel>
    {/each}
  {/if}
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

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
