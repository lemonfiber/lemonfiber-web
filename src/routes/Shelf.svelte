<script lang="ts">
  import Board from "./Board.svelte";
  import Action from "../components/Action.svelte";
  import Poster from "../components/Poster.svelte";
  import Panel from "../components/Panel.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import Value from "../components/Value.svelte";
  import { artworkAt, type Heard } from "../api/member";
  import type { Freshness } from "../lib/freshness";
  import type { Access } from "../lib/wire";
  import { captionOf, watchOf, type Shelf } from "../lib/yours";
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
</script>

<!--
  What a household member can watch, and what the household holds that they can.

  The shelf comes first, drawn as posters, each with its title as text beneath
  it. Each poster is read from this page's own address, never from the media
  server's door, and a title with no poster, or one that cannot be read, is
  drawn lettered with its name. What the
  member is held to follows it.

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
  <Panel stamped="quiet" title={m.member_shelf_title()} {freshness}>
    {#if held !== undefined && held.holdings.length > 0}
      <ul class="posters" aria-label={m.member_shelf_title()}>
        {#each held.holdings as holding (holding.id)}
          <li>
            <Poster
              title={holding.title}
              artwork={artworkAt(holding.id, "poster")}
              note={captionOf(holding)}
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

  .again {
    margin-top: var(--sp-3);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
