<script lang="ts">
  import Action from "../components/Action.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import Value from "../components/Value.svelte";
  import type { Heard } from "../api/member";
  import {
    episodeOf,
    factsOf,
    genresOf,
    runsOf,
    seasonOf,
    type Told,
  } from "../lib/title";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** Its name, as the shelf has it, so the card is named before it is read. */
    name: string;
    /** What reading it came to, or nothing while it is being read. */
    answer: Heard<Told> | undefined;
    /** Its poster, where the shelf has drawn one. */
    artwork?: string | undefined;
    /** Put the card away. */
    onclose: () => void;
    /** Ask again, where it could not be read. */
    onretry?: (() => void) | undefined;
  }

  let { name, answer, artwork, onclose, onretry }: Props = $props();

  /** Tells this card's headings apart from any other on the page. */
  const uid = $props.id();

  /** The title, where it was read and is still on the member's shelf. */
  const title = $derived(
    answer?.at === "answered" ? (answer.value.title ?? undefined) : undefined,
  );

  /**
   * Opens the card over the page, and puts it away however it is closed:
   * Escape, the browser's own way, or the close button.
   */
  function shown(dialog: HTMLDialogElement): () => void {
    dialog.showModal();
    const closed = (): void => {
      onclose();
    };
    dialog.addEventListener("close", closed);
    return () => {
      dialog.removeEventListener("close", closed);
      if (dialog.open) dialog.close();
    };
  }
</script>

<!--
  One title on the member's shelf, opened over it: what it is, and a series'
  seasons and episodes.

  It is drawn from what lemonfiber answered when it was opened and nothing
  else. Where the title has left the shelf since, that is said; where it could
  not be read, that is said, with a way to ask again. Nothing here is how the
  title is stored or where it streams from: those are the server's.
-->
<dialog class="card" aria-labelledby="{uid}-name" {@attach shown}>
  <header>
    <h2 id="{uid}-name">{name}</h2>
    <Action label={m.member_title_close()} onclick={onclose} />
  </header>

  {#if answer === undefined}
    <Skeleton width="16rem" label={m.waiting_answer()} />
  {:else if title !== undefined}
    {@const genres = genresOf(title)}
    {@const overview = title.overview ?? undefined}
    <div class="lead" class:pictured={artwork !== undefined}>
      {#if artwork !== undefined}
        <img class="art" src={artwork} alt="" />
      {/if}
      <div class="about">
        <p class="facts">{factsOf(title)}</p>
        {#if genres !== undefined}
          <p class="genres">{genres}</p>
        {/if}
        {#if overview !== undefined}
          <p class="overview">{overview}</p>
        {/if}
      </div>
    </div>

    {#if title.seasons.length > 0}
      <section aria-labelledby="{uid}-seasons">
        <h3 id="{uid}-seasons">{m.member_title_seasons()}</h3>
        {#each title.seasons as season (season.id)}
          <details class="season">
            <summary>{seasonOf(season)}</summary>
            <ol class="episodes">
              {#each season.episodes as episode (episode.id)}
                {@const runs = runsOf(episode)}
                {@const plot = episode.overview ?? undefined}
                <li>
                  <span class="name">{episodeOf(episode)}</span>
                  {#if runs !== undefined}
                    <span class="runs">{runs}</span>
                  {/if}
                  {#if plot !== undefined}
                    <p class="plot">{plot}</p>
                  {/if}
                </li>
              {/each}
            </ol>
          </details>
        {/each}
      </section>
    {/if}
  {:else if answer.at === "answered"}
    <Value state="known" absent={m.member_title_gone()} />
  {:else}
    <Value
      state="unknown"
      absent={answer.at === "declined" ? answer.said : m.member_title_unread()}
    />
    {#if onretry !== undefined}
      <div class="again">
        <Action label={m.action_try_again()} onclick={onretry} />
      </div>
    {/if}
  {/if}
</dialog>

<style>
  .card {
    width: min(100% - 2 * var(--sp-4), 46rem);
    max-height: calc(100dvh - 2 * var(--sp-4));
    overflow: auto;
    padding: var(--panel-pad);
    color: var(--text);
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--r-md);
  }

  .card::backdrop {
    background: color-mix(in srgb, var(--ink) 60%, transparent);
  }

  header {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: var(--sp-3);
    margin-bottom: var(--sp-4);
  }

  /* The title is what the card is about, so it is set as the page's own
     headings are rather than as a panel's. */
  h2 {
    margin: 0;
    font-family: var(--brandface);
    font-size: var(--text-unit);
    font-weight: 600;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  h3 {
    margin: var(--sp-5) 0 var(--sp-2);
    font-size: var(--text-prose);
    font-weight: 600;
  }

  .lead {
    display: grid;
    gap: var(--sp-4);
  }

  /* Beside the words on a screen wide enough, above them on a phone. */
  .lead.pictured {
    grid-template-columns: minmax(0, 10rem) minmax(0, 1fr);
  }

  .art {
    width: 100%;
    max-width: 12rem;
    aspect-ratio: 2/3;
    object-fit: cover;
    border-radius: var(--r-sm);
    border: 1px solid var(--ink);
    background: var(--pith);
  }

  .about {
    min-width: 0;
  }

  .facts,
  .genres,
  .overview,
  .plot {
    margin: 0 0 var(--sp-2);
    max-width: 62ch;
  }

  .facts {
    color: var(--muted);
    font-size: var(--text-note);
    font-weight: 600;
  }

  .genres,
  .runs {
    color: var(--muted);
    font-size: var(--text-note);
  }

  .overview {
    font-size: var(--text-prose);
  }

  .season + .season {
    margin-top: var(--sp-2);
  }

  summary {
    min-height: 1.5rem;
    padding: var(--sp-1) 0;
    cursor: pointer;
    font-weight: 600;
  }

  .episodes {
    margin: var(--sp-2) 0 0;
    padding-left: 0;
    list-style: none;
  }

  .episodes li + li {
    margin-top: var(--sp-3);
  }

  .runs {
    margin-left: var(--sp-2);
  }

  .plot {
    margin-top: var(--sp-1);
    color: var(--muted);
    font-size: var(--text-note);
  }

  .again {
    margin-top: var(--sp-3);
  }

  @media (max-width: 30rem) {
    .lead.pictured {
      grid-template-columns: minmax(0, 8rem);
    }
  }
</style>
