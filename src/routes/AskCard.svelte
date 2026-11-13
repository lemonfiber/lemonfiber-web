<script lang="ts">
  import Action from "../components/Action.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import Value from "../components/Value.svelte";
  import { saidNo, type Heard } from "../api/member";
  import {
    captionOfFound,
    mayAsk,
    standsOf,
    type Asked,
    type FoundTitle,
  } from "../lib/askable";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** The title, as the page of the search named it. */
    title: FoundTitle;
    /** Its poster, where the search has drawn one. */
    artwork?: string | undefined;
    /** What rehearsing the ask came to, or nothing while it is rehearsed. */
    rehearsal: Heard<Asked> | undefined;
    /** What the ask came to, once it was sent and answered. */
    sent?: Heard<Asked> | undefined;
    /** Whether the ask is on its way to lemonfiber now. */
    sending?: boolean | undefined;
    /** Send the ask. */
    onask: () => void;
    /** Rehearse it again, where the rehearsal could not be read. */
    onrehearse: () => void;
    /** Put the card away. */
    onclose: () => void;
  }

  let {
    title,
    artwork,
    rehearsal,
    sent,
    sending = false,
    onask,
    onrehearse,
    onclose,
  }: Props = $props();

  /** Tells this card's headings apart from any other on the page. */
  const uid = $props.id();

  /** Whether lemonfiber offered it to be asked for. */
  const askable = $derived(mayAsk(title));

  /** What lemonfiber said the ask came to, where it said anything. */
  const settled = $derived(
    sent?.at === "answered" ? sent.value.said : saidNo(sent),
  );

  /** Whether the ask went unanswered, and so was asked for nowhere. */
  const lost = $derived(sent !== undefined && settled === undefined);

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
  One title a member's search found, opened over it, and asking for it.

  What asking would come to is lemonfiber's rehearsal of the ask, read when the
  card opens: whether it waits for approval and what it leaves of their
  allowance, in lemonfiber's own sentence. The ask is sent only when they press
  for it, and what it came to replaces the rehearsal.

  An ask that went unanswered was asked for nowhere: it is said so, and asking
  again sends the same ask, which lemonfiber carries out once. Nothing waits to
  be sent on its own.

  A title that may not be asked for still has its action, drawn unusable and
  naming where the title stands.
-->
<dialog class="card" aria-labelledby="{uid}-name" {@attach shown}>
  <header>
    <h2 id="{uid}-name">{title.title}</h2>
    <Action label={m.member_title_close()} onclick={onclose} />
  </header>

  <div class="lead" class:pictured={artwork !== undefined}>
    {#if artwork !== undefined}
      <img class="art" src={artwork} alt="" />
    {/if}
    <div class="about">
      <p class="facts">{captionOfFound(title)}</p>
      <p class="stands">{standsOf(title.stands)}</p>

      {#if !askable}
        <Action label={standsOf(title.stands)} weight="firm" off />
      {:else if settled !== undefined}
        <p class="reply" role="status">{settled}</p>
      {:else if rehearsal === undefined}
        <Skeleton width="16rem" label={m.waiting_answer()} />
      {:else if rehearsal.at === "answered"}
        <p class="reply">{rehearsal.value.said}</p>
        {#if lost}
          <p class="reply" role="alert">{m.found_ask_unanswered()}</p>
        {/if}
        <Action
          label={sending
            ? m.found_asking()
            : lost
              ? m.action_try_again()
              : m.found_ask()}
          weight="firm"
          off={sending}
          onclick={onask}
        />
      {:else}
        <Value
          state="unknown"
          absent={saidNo(rehearsal) ?? m.found_rehearsal_unread()}
        />
        <div class="again">
          <Action label={m.action_try_again()} onclick={onrehearse} />
        </div>
      {/if}
    </div>
  </div>
</dialog>

<style>
  .card {
    width: min(100% - 2 * var(--sp-4), 40rem);
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

  h2 {
    margin: 0;
    font-family: var(--brandface);
    font-size: var(--text-unit);
    font-weight: 600;
    line-height: 1.25;
    overflow-wrap: anywhere;
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
  .stands,
  .reply {
    margin: 0 0 var(--sp-3);
    max-width: 62ch;
  }

  .facts {
    color: var(--muted);
    font-size: var(--text-note);
    font-weight: 600;
  }

  .stands,
  .reply {
    font-size: var(--text-prose);
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
