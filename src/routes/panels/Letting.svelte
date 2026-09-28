<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { linesOf } from "../../lib/came";
  import type { Freshness } from "../../lib/freshness";
  import { candidateLines, seeding, type Reckoned } from "../../lib/letting";
  import { standingOffer, type Letter } from "../../lib/seeding";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The disk accounting, or why it could not be read. */
    space: Reading<Reckoned> | undefined;
    /** What letting a download go asks for, and what came of it. */
    letter: Letter;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { space, letter, freshness }: Props = $props();

  const offerId = $props.id();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  const candidates = $derived(
    space?.ok === true ? space.value.candidates : undefined,
  );
  const problem = $derived(
    space?.ok === false ? space.problem.message : undefined,
  );
  const offer = $derived(standingOffer(letter.work));
  const parted = $derived(letter.work.length > 0);
</script>

<!--
  The completed downloads the disk accounting names, and letting one go.

  What letting one go costs is asked first: without an offer, the request lets
  nothing go and answers with the cost and a name for the offer. There is no
  bare yes. The yes stands under that record and carries the offer's name, so
  the client lets go of what was read or lemonfiber refuses.
-->
<Panel title={m.panel_letting()} {freshness} flush>
  <div class="scope">
    <p>{m.letting_prose()}</p>
    {#if candidates === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if candidates === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {:else if candidates.length === 0}
      <p>{m.letting_none()}</p>
    {/if}
  </div>

  {#if candidates !== undefined && candidates.length > 0}
    <ul class="candidates" aria-label={m.letting_said()}>
      {#each candidates as candidate (candidate.name)}
        <li>
          <h3>{candidate.name}</h3>
          <ul class="lines">
            {#each candidateLines(candidate) as line, at (at)}
              <li><span class="word">{line}</span></li>
            {/each}
          </ul>
          {#if seeding(candidate)}
            <Action
              label={m.action_let_go_cost({ name: candidate.name })}
              off={letter.busy}
              onclick={() => {
                letter.onask({
                  doing: "stop-seeding",
                  download: candidate.name,
                });
                landing();
              }}
            />
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.letting_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if offer !== undefined}
      <section class="plan" aria-labelledby={offerId}>
        <h3 id={offerId}>{m.let_go_plan_title({ name: offer.download })}</h3>
        <p class="prose">{m.let_go_plan_prose()}</p>
        <div class="acts">
          <Action
            label={m.action_let_go_yes()}
            weight="firm"
            off={letter.busy}
            onclick={() => {
              letter.onask({
                doing: "stop-seeding",
                download: offer.download,
                offer: offer.offer,
              });
              landing();
            }}
          />
          <Action
            label={m.action_leave_as_is()}
            onclick={() => {
              letter.ondrop(offer.id);
              landing();
            }}
          />
        </div>
      </section>
    {/if}

    {#each letter.work as one (one.id)}
      {@const said = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            letter.ondrop(one.id);
            landing();
          }}
        />
      {/snippet}
      <Item
        state={said.state}
        eyebrow={said.eyebrow}
        title={titleOfDoing(one.doing, one.scoped)}
        prose={said.prose}
        lines={one.at === "done"
          ? { named: m.came_heading(), said: linesOf(one.came) }
          : undefined}
        actions={dropping}
      />
    {/each}
  </div>
</Panel>

<style>
  .scope {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--panel-pad) var(--sp-3);
  }

  .scope p,
  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .candidates {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .candidates > li {
    display: grid;
    gap: var(--sp-2);
    justify-items: start;
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  .lines {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .lines li {
    font-size: var(--text-prose);
    color: var(--muted);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  /* The rule appears only when there is something under it, so a panel nobody
     has asked anything of ends at its own border rather than at a spare line. */
  .parted {
    border-top: 1px solid var(--line);
  }

  /* Focus is put here after a row is taken away, and it is not a place the tab
     order stops at, so the ring would mark somewhere nobody steered to. */
  .asked:focus {
    outline: none;
  }

  .plan {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-4) var(--panel-pad);
    border-bottom: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
