<script lang="ts">
  import { onDestroy } from "svelte";
  import Board from "./Board.svelte";
  import Action from "../components/Action.svelte";
  import Meter from "../components/Meter.svelte";
  import Poster from "../components/Poster.svelte";
  import Panel from "../components/Panel.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import Value from "../components/Value.svelte";
  import TitleCard from "./TitleCard.svelte";
  import type { Heard } from "../api/member";
  import type { Freshness } from "../lib/freshness";
  import { Gallery, onScreen, type Taking } from "../lib/gallery.svelte";
  import {
    farOf,
    partOf,
    shelvedAs,
    type PartWay,
    type PartWays,
  } from "../lib/partway";
  import type { Told } from "../lib/title";
  import type { Access } from "../lib/wire";
  import { captionOf, watchOf, type Holding, type Shelf } from "../lib/yours";
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
    /** What they were part-way through, as lemonfiber answered it this time. */
    watching?: Heard<PartWays> | undefined;
    /** Ask again, where something could not be read. */
    onretry?: (() => void) | undefined;
    /** Asking for one title's poster. Left out, every title is lettered. */
    posters?: Taking | undefined;
    /** The title opened over the shelf, where one is. */
    opened?: Holding | undefined;
    /** What reading the opened title came to, or nothing while it is read. */
    told?: Heard<Told> | undefined;
    /** Open one title. Left out, the posters open nothing. */
    onopen?: ((holding: Holding) => void) | undefined;
    /** Put the opened title away. */
    onclose?: (() => void) | undefined;
  }

  let {
    access,
    watched,
    shelf,
    freshness,
    watching,
    onretry,
    posters,
    opened,
    told,
    onopen,
    onclose,
  }: Props = $props();

  /** The posters on screen, fetched with the session's key. */
  const gallery = new Gallery((id) =>
    posters === undefined ? Promise.resolve(undefined) : posters(id),
  );

  onDestroy(gallery.releaseAll);

  /** What they may watch, where it was answered and says anything. */
  const limits = $derived(
    access?.at === "answered" && access.value.length > 0
      ? access.value
      : undefined,
  );

  /**
   * What they were part-way through, where it was read and holds anything.
   * Nothing part-way is no panel at all: there is nothing to carry on with.
   */
  const partWay = $derived(
    watching?.at === "answered" &&
      watching.value.available &&
      watching.value.part_way.length > 0
      ? watching.value.part_way
      : undefined,
  );

  /**
   * What is said where what they were part-way through went unread: what
   * lemonfiber said where it declined, and that it went unread otherwise.
   */
  const partWayUnread = $derived(unreadOf(watching));

  /** A panel that went unread was answered at no time it can be stamped with. */
  const UNREAD: Freshness = { kind: "never" };

  function unreadOf(answer: Heard<PartWays> | undefined): string | undefined {
    if (answer === undefined) return undefined;
    if (answer.at === "declined") return answer.said;
    if (answer.at === "answered" && answer.value.available) return undefined;
    return m.member_partway_unread();
  }

  /** Open what they were part-way through, where it is a shelf title. */
  function opening(one: PartWay): (() => void) | undefined {
    const holding = shelvedAs(one);
    if (holding === undefined || onopen === undefined) return undefined;
    const open = onopen;
    return () => {
      open(holding);
    };
  }

  /** The shelf, where it was answered and could be read. */
  const held = $derived(
    shelf?.at === "answered" && shelf.value.available ? shelf.value : undefined,
  );
</script>

<!--
  What a household member can watch, and what the household holds that they can.

  The shelf comes first, drawn as posters, each with its title as text beneath
  it. Each poster is read from this page's own address with the session's key,
  never from the media server's door, while it is on screen, and let go once
  it is not. A title with no poster, or one that cannot be read, is drawn
  lettered with its name. Pressing a poster opens what the title is over the
  shelf, read when it is opened. What the member is held to follows it.

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
  {#if partWay !== undefined}
    <Panel stamped="quiet" title={m.member_partway_title()} {freshness}>
      <ul class="posters" aria-label={m.member_partway_title()}>
        {#each partWay as one (one.id)}
          {@const part = partOf(one)}
          <li class="part-way" {@attach onScreen(gallery, one.id)}>
            <Poster
              title={one.title}
              artwork={gallery.drawnFrom(one.id)}
              note={farOf(one)}
              onopen={opening(one)}
            />
            {#if part !== undefined}
              <Meter
                {part}
                label={m.member_partway_meter({ title: one.title })}
              />
            {/if}
          </li>
        {/each}
      </ul>
    </Panel>
  {:else if partWayUnread !== undefined}
    <Panel stamped="quiet" title={m.member_partway_title()} freshness={UNREAD}>
      <Value state="unknown" absent={partWayUnread} />
    </Panel>
  {/if}

  <Panel stamped="quiet" title={m.member_shelf_title()} {freshness}>
    {#if held !== undefined && held.holdings.length > 0}
      <ul class="posters" aria-label={m.member_shelf_title()}>
        {#each held.holdings as holding (holding.id)}
          <li {@attach onScreen(gallery, holding.id)}>
            <Poster
              title={holding.title}
              artwork={gallery.drawnFrom(holding.id)}
              note={captionOf(holding)}
              onopen={onopen === undefined
                ? undefined
                : () => {
                    onopen(holding);
                  }}
            />
          </li>
        {/each}
      </ul>
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
</Board>

{#if opened !== undefined && onclose !== undefined}
  <TitleCard
    name={opened.title}
    answer={told}
    artwork={gallery.drawnFrom(opened.id)}
    {onclose}
    onretry={onopen === undefined
      ? undefined
      : () => {
          onopen(opened);
        }}
  />
{/if}

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

  /* As many posters to a row as fit at a width a title can still be read at,
     so a phone shows two and a wide screen shows a shelf. */
  .posters {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
    gap: var(--sp-5) var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .part-way {
    display: grid;
    gap: var(--sp-2);
    align-content: start;
  }

  .again {
    margin-top: var(--sp-3);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
