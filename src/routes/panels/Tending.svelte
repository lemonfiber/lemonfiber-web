<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Switch from "../../components/Switch.svelte";
  import Limiting from "./Limiting.svelte";
  import { linesOf } from "../../lib/came";
  import type { Freshness } from "../../lib/freshness";
  import {
    offerTyped,
    questionOfTend,
    standingInvitation,
    termsTyped,
    type Limits,
    type Tender,
  } from "../../lib/tending";
  import type { Policy } from "../../lib/wire";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the household panel can ask for, and what has come of asking. */
    tender: Tender;
    /** What happens to what the house asks for, where it could be read. */
    policy: Policy | null | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { tender, policy, freshness }: Props = $props();

  const offerId = $props.id();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Which of the two forms is open, where one is. */
  let open = $state<"invite" | "limits" | undefined>(undefined);

  /** The name an account is offered under, as typed. */
  let name = $state("");

  /** The highest rating they may watch, as typed; empty is no limit. */
  let age = $state("");

  /** Whether what nothing has rated is held back from them. */
  let holdUnrated = $state(true);

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  const terms = $derived(termsTyped(age, holdUnrated));
  const offer = $derived(offerTyped(name, terms));
  const standing = $derived(standingInvitation(tender.work));
  const question = $derived(
    tender.asked === undefined ? undefined : questionOfTend(tender.asked),
  );
  const silent = $derived(tender.busy || question !== undefined);
  const parted = $derived(
    question !== undefined || standing !== undefined || tender.work.length > 0,
  );
</script>

<!--
  The operator's acts on the household as a whole, and everything that has come
  of acting on it, for the whole house and for each person in it.

  Offering somebody an account is read first: unconfirmed it makes nothing and
  answers with the invitation it would make, and the yes under that is the
  same offer, confirmed, on the terms that were read. An age limit is a number;
  where one is given, whether what nothing has rated is held back goes with it.

  Saying what the house may ask for is made at once, and is answered with the
  household as it now stands.
-->
<Panel title={m.panel_tending()} {freshness} flush>
  <div class="scope">
    <p>{m.tending_prose()}</p>
  </div>

  <div class="controls" role="group" aria-label={m.tending_controls()}>
    <Action
      label={m.action_invite_open()}
      off={silent}
      onclick={() => {
        open = "invite";
      }}
    />
    <Action
      label={m.action_limits_house()}
      off={silent}
      onclick={() => {
        open = "limits";
      }}
    />
  </div>

  {#if open === "invite"}
    <div class="form">
      <Field
        label={m.invite_name()}
        value={name}
        purpose="who"
        oninput={(value: string) => {
          name = value;
        }}
      />
      <Field
        label={m.invite_age()}
        value={age}
        figure
        hint={terms === undefined ? m.invite_age_unread() : m.invite_age_hint()}
        oninput={(value: string) => {
          age = value;
        }}
      />
      {#if terms?.ageLimit !== undefined}
        <div class="choice">
          <p class="prose">{m.invite_unrated()}</p>
          <Switch
            on={holdUnrated}
            label={m.invite_unrated()}
            onclick={() => {
              holdUnrated = !holdUnrated;
            }}
          />
        </div>
      {/if}
      <div class="acts">
        {#if offer === undefined}
          <Action label={m.action_invite_read()} weight="firm" off />
        {:else}
          <Action
            label={m.action_invite_read()}
            weight="firm"
            off={silent}
            onclick={() => {
              tender.onask(offer);
              open = undefined;
              landing();
            }}
          />
        {/if}
        <Action
          label={m.action_leave_as_is()}
          onclick={() => {
            open = undefined;
          }}
        />
      </div>
    </div>
  {:else if open === "limits"}
    <div class="form">
      <Limiting
        name={undefined}
        {policy}
        busy={tender.busy}
        onkeep={(limits: Limits) => {
          tender.onask({ doing: "household-allow", limits });
          open = undefined;
          landing();
        }}
        onleave={() => {
          open = undefined;
        }}
      />
    </div>
  {/if}

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.tending_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if tender.asked !== undefined && question !== undefined}
      {@const asking = tender.asked}
      {#snippet answering()}
        <Action
          label={question.yes}
          weight="firm"
          onclick={() => {
            tender.onask(asking);
            landing();
          }}
        />
        <Action
          label={m.action_leave_as_is()}
          onclick={() => {
            tender.onleave();
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
        <h3 id={offerId}>{m.invite_offer_title({ name: standing.name })}</h3>
        <p class="prose">{m.invite_offer_prose()}</p>
        <div class="acts">
          <Action
            label={m.action_invite_yes({ name: standing.name })}
            weight="firm"
            off={tender.busy}
            onclick={() => {
              tender.onask({
                doing: "invite",
                name: standing.name,
                terms: standing.terms,
                confirm: true,
              });
              landing();
            }}
          />
          <Action
            label={m.action_leave_as_is()}
            onclick={() => {
              tender.ondrop(standing.id);
              landing();
            }}
          />
        </div>
      </section>
    {/if}

    {#each tender.work as one (one.id)}
      {@const said = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            tender.ondrop(one.id);
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

  .form {
    display: grid;
    gap: var(--sp-3);
    padding: 0 var(--panel-pad) var(--sp-3);
  }

  .choice {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-4);
    align-items: center;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
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
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-4) var(--panel-pad);
    border-bottom: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }
</style>
