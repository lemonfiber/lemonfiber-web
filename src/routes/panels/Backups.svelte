<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Switch from "../../components/Switch.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { linesOf } from "../../lib/came";
  import type { Freshness } from "../../lib/freshness";
  import type { Archives } from "../../lib/kept";
  import {
    questionOfKeep,
    standingListing,
    type Keeper,
  } from "../../lib/upkeep";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the backups panel can ask for, and what has come of asking. */
    keeper: Keeper;
    /** The backups this machine keeps, or why they could not be read. */
    archives: Reading<Archives> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { keeper, archives, freshness }: Props = $props();

  const listingId = $props.id();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Whether the archive is to be pointed at this machine's data location. */
  let repoint = $state(false);

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  const work = $derived(
    keeper.work.filter(
      (one) => one.doing === "backup" || one.doing === "restore",
    ),
  );
  const standing = $derived(standingListing(work));
  const question = $derived(
    keeper.asked === undefined ? undefined : questionOfKeep(keeper.asked),
  );
  const silent = $derived(keeper.busy || question !== undefined);
  const names = $derived(archives?.ok === true ? archives.value.archives : []);
  const problem = $derived(
    archives?.ok === false ? archives.problem.message : undefined,
  );
  const parted = $derived(
    question !== undefined || standing !== undefined || work.length > 0,
  );
</script>

<!--
  The backups this machine keeps, taking another, and putting one back.

  Taking a backup has nothing to read first, so it is asked about here before
  it is sent. Putting one back is asked for by the archive's name alone first,
  which changes nothing, and what comes back is the listing: what the archive
  covers, when it was taken and by which version, and whether it was taken
  against another data location than this machine's. The yes names the listing
  it was read in, and carries whether the archive is to be pointed at this
  machine's data location, which is a switch because it is the one choice the
  listing leaves open.

  Every archive's control names it, because a reader listing the controls on a
  screen is given the names and nothing around them. Every control that takes
  its own row away hands focus to the region the row was in.
-->
<Panel title={m.panel_backups()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.backups_prose()} /></p>
  </div>

  <div class="controls" role="group" aria-label={m.backups_controls()}>
    <Action
      label={m.action_backup()}
      off={silent}
      onclick={() => {
        keeper.onask({ doing: "backup" });
      }}
    />
  </div>

  {#if names.length > 0}
    <ul class="archives" aria-label={m.backups_kept()}>
      {#each names as archive (archive)}
        <li class="archive">
          <p class="name">{archive}</p>
          <Action
            label={m.action_restore_listing({ archive })}
            off={silent}
            onclick={() => {
              repoint = false;
              keeper.onask({ doing: "restore", archive });
            }}
          />
        </li>
      {/each}
    </ul>
  {:else}
    <div class="archives">
      {#if archives?.ok === true}
        <Value state="known" absent={m.backups_none()} />
      {:else if problem !== undefined}
        <Value state="unknown" absent={problem} />
      {:else}
        <Skeleton width="18rem" label={m.waiting_answer()} />
      {/if}
    </div>
  {/if}

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.backups_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if keeper.asked !== undefined && question !== undefined}
      {@const asking = keeper.asked}
      {#snippet answering()}
        <Action
          label={question.yes}
          weight="firm"
          onclick={() => {
            keeper.onask(asking);
            landing();
          }}
        />
        <Action
          label={m.action_leave_as_is()}
          onclick={() => {
            keeper.onleave();
            landing();
          }}
        />
      {/snippet}
      <Item
        state="stopped"
        eyebrow={question.eyebrow}
        title={question.title}
        prose={question.prose}
        actions={answering}
      />
    {/if}

    {#if standing !== undefined}
      <section class="listing" aria-labelledby={listingId}>
        <h3 id={listingId}>
          {m.backups_listing_title({ archive: standing.archive })}
        </h3>
        <p class="prose"><Said text={m.backups_listing_prose()} /></p>
        {#if standing.relocation !== undefined}
          <div class="choice">
            <p class="prose">
              {m.backups_repoint({
                now: standing.relocation.now,
                was: standing.relocation.was,
              })}
            </p>
            <Switch
              on={repoint}
              label={m.backups_repoint_label()}
              onclick={() => {
                repoint = !repoint;
              }}
            />
          </div>
        {/if}
        <div class="controls">
          <Action
            label={m.action_restore_yes({ archive: standing.archive })}
            weight="firm"
            off={keeper.busy}
            onclick={() => {
              keeper.onask({
                doing: "restore",
                archive: standing.archive,
                offer: standing.agreement,
                repoint,
              });
              landing();
            }}
          />
          <Action
            label={m.action_leave_as_is()}
            onclick={() => {
              keeper.ondrop(standing.id);
              landing();
            }}
          />
        </div>
      </section>
    {/if}

    {#each work as one (one.id)}
      {@const read = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            keeper.ondrop(one.id);
            landing();
          }}
        />
      {/snippet}
      <Item
        state={read.state}
        eyebrow={read.eyebrow}
        title={titleOfDoing(one.doing, one.scoped)}
        prose={read.prose}
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
    padding: var(--sp-4) var(--panel-pad) 0;
  }

  .scope p,
  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
  }

  .archives {
    display: grid;
    margin: 0;
    padding: 0 0 var(--sp-3);
    list-style: none;
  }

  div.archives {
    padding: 0 var(--panel-pad) var(--sp-3);
  }

  .archive {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-4);
    align-items: center;
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
  }

  .name {
    margin: 0;
    font-family: var(--mono);
    font-size: var(--text-note);
    overflow-wrap: anywhere;
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

  .listing {
    padding: var(--sp-4) 0 0;
    border-bottom: 1px solid var(--line);
  }

  .listing h3,
  .listing > .prose {
    padding: 0 var(--panel-pad);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-item);
    font-weight: 600;
  }

  .choice {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-4);
    align-items: center;
    margin: var(--sp-3) 0 0;
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }
</style>
