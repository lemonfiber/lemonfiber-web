<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Switch from "../../components/Switch.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { linesOf } from "../../lib/came";
  import type { Freshness } from "../../lib/freshness";
  import {
    questionOfMend,
    standingOffer,
    type Mend,
    type Mender,
  } from "../../lib/mending";
  import type { Diagnosis } from "../../lib/wire";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the checks screen can ask for, and what has come of asking. */
    mender: Mender;
    /** The run the warnings to accept are read from. */
    diagnosis: Reading<Diagnosis> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { mender, diagnosis, freshness }: Props = $props();

  const offerId = $props.id();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  const standing = $derived(standingOffer(mender.work));
  const question = $derived(
    mender.asked === undefined ? undefined : questionOfMend(mender.asked),
  );
  const silent = $derived(mender.busy || question !== undefined);
  const warnings = $derived(
    diagnosis?.ok === true
      ? diagnosis.value.findings.filter(
          (finding) =>
            finding.verdict.outcome === "warn" &&
            finding.verdict.state !== "suppressed",
        )
      : [],
  );
  const parted = $derived(
    question !== undefined || standing !== undefined || mender.work.length > 0,
  );

  /** Ask for something, from a control that stays where it is. */
  function ask(asking: Mend): void {
    mender.onask(asking);
  }
</script>

<!--
  What can be done about what the checks found, and everything that has come of
  asking.

  Seeing what can be put right changes nothing, so it is asked for at once and
  what comes back is the offer: what each repair would do, what else it
  changes, and whether it can be put back. Choosing from it is a list of
  switches, each named after the check it answers, and the yes names the offer
  it was read in, so lemonfiber can refuse to spend it on one that has moved on.

  The rest change something with nothing to read first, so each is asked about
  here before it is sent. A warning is accepted one at a time, and its control
  says which, because a reader listing the controls on a screen is given the
  names and nothing around them.

  Every control that takes its own row away hands focus to the region the row
  was in, rather than letting it fall to the document.
-->
<Panel title={m.panel_mending()} {freshness} flush>
  <div class="scope">
    <p>{m.mending_prose()}</p>
  </div>

  <div class="controls" role="group" aria-label={m.mending_controls()}>
    <Action
      label={m.action_offer_repairs()}
      off={silent}
      onclick={() => {
        ask({ doing: "repair" });
      }}
    />
    <Action
      label={m.action_diagnose()}
      off={silent}
      onclick={() => {
        ask({ doing: "diagnose" });
      }}
    />
    <Action
      label={m.action_undo_last()}
      off={silent}
      onclick={() => {
        ask({ doing: "undo" });
      }}
    />
  </div>

  {#if warnings.length > 0}
    <div class="controls" role="group" aria-label={m.mending_warnings()}>
      {#each warnings as finding (finding.check)}
        <Action
          label={m.action_accept({ check: finding.title })}
          off={silent}
          onclick={() => {
            ask({
              doing: "accept",
              check: finding.check,
              title: finding.title,
            });
          }}
        />
      {/each}
    </div>
  {/if}

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.mending_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if mender.asked !== undefined && question !== undefined}
      {@const asking = mender.asked}
      {#snippet answering()}
        <Action
          label={question.yes}
          weight="firm"
          onclick={() => {
            mender.onask(asking);
            landing();
          }}
        />
        <Action
          label={m.action_leave_as_is()}
          onclick={() => {
            mender.onleave();
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
      <section class="offer" aria-labelledby={offerId}>
        <h3 id={offerId}>{m.mending_offer_title()}</h3>
        <p class="prose">{m.mending_offer_prose()}</p>
        <ul class="repairs">
          {#each standing.offered as one (one.check)}
            <li class="repair">
              <div class="words">
                <p class="check">{one.check}</p>
                <p class="prose">{one.does}</p>
                {#if one.effects.length > 0}
                  <p class="prose">
                    {m.mending_effects({ effects: one.effects.join(" ") })}
                  </p>
                {/if}
                <p class="note">
                  {one.reversible
                    ? m.mending_reversible()
                    : m.mending_irreversible()}
                </p>
              </div>
              <Switch
                on={mender.picked.includes(one.check)}
                label={m.mending_choose({ check: one.check })}
                onclick={() => {
                  mender.onpick(one.check);
                }}
              />
            </li>
          {/each}
        </ul>
        <div class="controls">
          <Action
            label={m.action_repair_chosen()}
            weight="firm"
            off={mender.busy || mender.picked.length === 0}
            onclick={() => {
              mender.onask({
                doing: "repair",
                offer: standing.agreement,
                agreed: mender.picked,
              });
              landing();
            }}
          />
          <Action
            label={m.action_leave_as_is()}
            onclick={() => {
              mender.ondrop(standing.id);
              landing();
            }}
          />
        </div>
      </section>
    {/if}

    {#each mender.work as one (one.id)}
      {@const read = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            mender.ondrop(one.id);
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

  .offer {
    padding: var(--sp-4) 0 0;
    border-bottom: 1px solid var(--line);
  }

  .offer h3,
  .offer > .prose {
    padding: 0 var(--panel-pad);
  }

  h3 {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-item);
    font-weight: 600;
  }

  .repairs {
    display: grid;
    margin: var(--sp-3) 0 0;
    padding: 0;
    list-style: none;
  }

  .repair {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-4);
    align-items: center;
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
  }

  .words {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .check {
    margin: 0 0 var(--sp-1);
    font-family: var(--mono);
    font-size: var(--text-note);
    font-weight: 600;
  }

  .note {
    margin: var(--sp-1) 0 0;
    font-size: var(--text-note);
    color: var(--faint);
  }
</style>
