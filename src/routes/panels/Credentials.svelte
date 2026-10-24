<script lang="ts">
  import ShowAll from "../../components/ShowAll.svelte";
  import Said from "../../components/Said.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import {
    grantLine,
    grantsOf,
    heldLines,
    strayGrantLine,
    strayGrants,
    type Inventory,
  } from "../../lib/credentials";
  import type { Revoker } from "../../lib/revoking";
  import Granted from "./Granted.svelte";
  import Revoking from "./Revoking.svelte";
  import type { Freshness } from "../../lib/freshness";
  import { SHORT_DETAILED, Shortening } from "../../lib/shortening.svelte";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Every credential, without values, or why they could not be read. */
    credentials: Reading<Inventory> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
    /** What ending a grant asks for, where this page may act. */
    revoker?: Revoker | undefined;
  }

  let { credentials, freshness, revoker }: Props = $props();

  const protectionId = $props.id();
  const strayId = `${protectionId}-stray`;

  const inventory = $derived(
    credentials?.ok === true ? credentials.value : undefined,
  );
  const problem = $derived(
    credentials?.ok === false ? credentials.problem.message : undefined,
  );

  /** Whether the list is shown whole. */
  const short = new Shortening(SHORT_DETAILED);

  const strays = $derived(
    inventory === undefined ? [] : strayGrants(inventory),
  );
</script>

<!--
  Every credential the stack holds: where it stands, who made it, whose it is,
  where its value lives, the setting it is recorded under and everything that
  signs in with it, and each plugin it is granted to, with what for and when.
  The inventory carries no value, so none is drawn. Under it, lemonfiber's own
  account of what keeping them in files protects against and what it does not.
  Where acting is given, each grant can be ended, read first and agreed to
  under the name its reading gave itself.
-->
<Panel title={m.panel_credentials()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.credential_prose()} /></p>
    {#if inventory === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if inventory === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {:else if inventory.held.length === 0}
      <p><Said text={m.credential_none()} /></p>
    {/if}
  </div>

  {#if inventory !== undefined}
    {#if inventory.held.length > 0}
      <ul class="held" aria-label={m.credential_said()}>
        {#each short.of(inventory.held) as one, place (place)}
          {@const grants = grantsOf(one, inventory.grants)}
          <li>
            <h3>{one.name}</h3>
            <ul class="lines">
              {#each heldLines(one) as line, at (at)}
                <li><Said text={line} /></li>
              {/each}
            </ul>
            {#if grants.length > 0}
              <ul class="lines grants" aria-label={m.credential_grants_said()}>
                {#each grants as grant (grant.plugin)}
                  <Granted {grant} line={grantLine(grant)} {revoker} />
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
      <ShowAll items={inventory.held} shortening={short} />
    {/if}

    {#if strays.length > 0}
      <section class="stray" aria-labelledby={strayId}>
        <h3 id={strayId}>{m.credential_grants_stray()}</h3>
        <ul class="lines grants">
          {#each strays as grant, at (at)}
            <Granted {grant} line={strayGrantLine(grant)} {revoker} />
          {/each}
        </ul>
      </section>
    {/if}

    <section class="protection" aria-labelledby={protectionId}>
      <h3 id={protectionId}>{m.credential_protection()}</h3>
      <p>{inventory.protection.summary}</p>
      <p><Said text={m.credential_against()} /></p>
      <ul class="lines">
        {#each inventory.protection.against as said, at (at)}
          <li><Said text={said} /></li>
        {/each}
      </ul>
      <p><Said text={m.credential_not_against()} /></p>
      <ul class="lines">
        {#each inventory.protection.not_against as said, at (at)}
          <li><Said text={said} /></li>
        {/each}
      </ul>
    </section>
  {/if}
  {#if revoker !== undefined}
    <Revoking {revoker} />
  {/if}
</Panel>

<style>
  .scope {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--panel-pad) var(--sp-3);
  }

  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .held {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .held > li,
  .stray,
  .protection {
    display: grid;
    gap: var(--sp-2);
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
</style>
