<script lang="ts">
  import { onDestroy } from "svelte";
  import AskCard from "./AskCard.svelte";
  import Board from "./Board.svelte";
  import Action from "../components/Action.svelte";
  import Field from "../components/Field.svelte";
  import Panel from "../components/Panel.svelte";
  import Poster from "../components/Poster.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import Value from "../components/Value.svelte";
  import { saidNo, type Heard } from "../api/member";
  import {
    captionOfFound,
    keyOf,
    standsOf,
    stateOfFound,
    type Asked,
    type Found,
    type FoundTitle,
  } from "../lib/askable";
  import type { Freshness } from "../lib/freshness";
  import { Gallery, onScreen, type Taking } from "../lib/gallery.svelte";
  import { leftOf } from "../lib/yours";
  import * as m from "../paraglide/messages.js";

  /** What a page of the search that was not answered came to. */
  type Unread = Exclude<Heard<Found>, { at: "answered" }>;

  interface Props {
    /** The words in the search box. */
    term: string;
    /** Every page of the latest search lemonfiber answered, in order. */
    pages: readonly Found[];
    /** Which page is being read now, where one is. */
    reading?: "first" | "more" | undefined;
    /** What the latest page asked for came to, where it was not answered. */
    unread?: Unread | undefined;
    /** When the first page was answered. */
    freshness: Freshness;
    /** What typing in the box asks for. */
    oninput: (term: string) => void;
    /** Search for the words in the box. */
    onsearch: () => void;
    /** Read the page that begins where the last one said. */
    onmore: (after: string) => void;
    /** Read again the page that went unread. */
    onagain: () => void;
    /** Asking for one found title's poster, by its key. */
    posters?: Taking | undefined;
    /** The title opened over the search, where one is. */
    opened?: FoundTitle | undefined;
    /** What rehearsing an ask for it came to, or nothing while it is read. */
    rehearsal?: Heard<Asked> | undefined;
    /** What asking for it came to, once sent. */
    sent?: Heard<Asked> | undefined;
    /** Whether the ask is on its way now. */
    sending?: boolean | undefined;
    /** Open one title. */
    onopen: (title: FoundTitle) => void;
    /** Send the ask for the opened title. */
    onask: (title: FoundTitle) => void;
    /** Rehearse the ask for the opened title again. */
    onrehearse: (title: FoundTitle) => void;
    /** Put the opened title away. */
    onclose: () => void;
  }

  let {
    term,
    pages,
    reading,
    unread,
    freshness,
    oninput,
    onsearch,
    onmore,
    onagain,
    posters,
    opened,
    rehearsal,
    sent,
    sending,
    onopen,
    onask,
    onrehearse,
    onclose,
  }: Props = $props();

  /** The posters on screen, fetched with the session's key. */
  const gallery = new Gallery((key) =>
    posters === undefined ? Promise.resolve(undefined) : posters(key),
  );

  onDestroy(gallery.releaseAll);

  /** Tells this screen's form apart from any other on the page. */
  const uid = $props.id();

  /** The first page, which says what asking does for them. */
  const first = $derived(pages.at(0));

  /** Every title found so far, across the pages read. */
  const titles = $derived(pages.flatMap((page) => page.titles));

  /** Where lemonfiber said the page after the last one read begins, if any. */
  const next = $derived(pages.at(-1)?.next ?? undefined);

  /** What is said where a page went unread. */
  const unsaid = $derived(
    unread === undefined ? undefined : (saidNo(unread) ?? m.found_unread()),
  );
</script>

<!--
  Asking for something the household does not hold yet.

  The search is lemonfiber's, under the member's own limits: a title a limit
  holds back is never on a page, so nothing here hides one. Before anything
  found comes what asking does for them — whether it waits for approval and how
  much they have left — as lemonfiber answered it with the first page.

  Each title found is a poster, its picture read from this page's own address
  with the session's key and never from the catalogue, and says where it stands
  in the house. Pressing one opens it, with what asking for it would come to.

  A page that went unread is said as that, with a way to ask again, and is never
  drawn as a search that found nothing.
-->
<Board>
  <section class="search" aria-labelledby="{uid}-title">
    <h2 id="{uid}-title" class="heading">{m.found_title()}</h2>
    <form
      role="search"
      aria-labelledby="{uid}-title"
      onsubmit={(event: SubmitEvent) => {
        event.preventDefault();
        onsearch();
      }}
    >
      <Field
        label={m.found_label()}
        value={term}
        hint={m.found_hint()}
        purpose="search"
        {oninput}
      />
      <Action
        label={m.found_search()}
        weight="firm"
        off={reading !== undefined}
        submits
      />
    </form>
  </section>

  {#if first !== undefined}
    <Panel stamped="quiet" title={m.member_asking_title()} {freshness}>
      <p class="line"><span class="word">{first.approval}</span></p>
      <p class="line"><span class="word">{leftOf(first.asking)}</span></p>
    </Panel>

    <Panel
      stamped="quiet"
      title={m.found_for({ term: first.term })}
      {freshness}
    >
      {#if titles.length > 0}
        <ul class="posters" aria-label={m.found_for({ term: first.term })}>
          {#each titles as title (keyOf(title))}
            {@const tagged = stateOfFound(title.stands)}
            <li {@attach onScreen(gallery, keyOf(title))}>
              <Poster
                title={title.title}
                artwork={gallery.drawnFrom(keyOf(title))}
                state={tagged}
                label={tagged === undefined
                  ? undefined
                  : standsOf(title.stands)}
                note={captionOfFound(title)}
                onopen={() => {
                  onopen(title);
                }}
              />
            </li>
          {/each}
        </ul>
      {:else}
        <Value state="known" absent={m.found_nothing()} />
      {/if}

      {#if reading === "more"}
        <div class="again">
          <Skeleton width="10rem" label={m.waiting_answer()} />
        </div>
      {:else if unsaid !== undefined}
        <div class="again">
          <Value state="unknown" absent={unsaid} />
          <Action label={m.action_try_again()} onclick={onagain} />
        </div>
      {:else if next !== undefined}
        <div class="again">
          <Action
            label={m.found_more()}
            onclick={() => {
              onmore(next);
            }}
          />
        </div>
      {/if}
    </Panel>
  {:else if reading === "first"}
    <Skeleton width="16rem" label={m.waiting_answer()} />
  {:else if unsaid !== undefined}
    <div class="again">
      <Value state="unknown" absent={unsaid} />
      <Action label={m.action_try_again()} onclick={onagain} />
    </div>
  {:else}
    <p class="line"><span class="word">{m.found_first()}</span></p>
  {/if}
</Board>

{#if opened !== undefined}
  {@const title = opened}
  <AskCard
    {title}
    artwork={gallery.drawnFrom(keyOf(title))}
    {rehearsal}
    {sent}
    {sending}
    onask={() => {
      onask(title);
    }}
    onrehearse={() => {
      onrehearse(title);
    }}
    {onclose}
  />
{/if}

<style>
  .search form {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--sp-3);
  }

  .heading {
    margin: 0 0 var(--sp-3);
    font-family: var(--brandface);
    font-size: var(--text-unit);
    font-weight: 600;
  }

  .line {
    margin: 0;
    max-width: 62ch;
    font-size: var(--text-prose);
    color: var(--text);
  }

  .line + .line {
    margin-top: var(--sp-2);
  }

  .posters {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
    gap: var(--sp-5) var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .again {
    margin-top: var(--sp-4);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
