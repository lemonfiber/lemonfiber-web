<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Panel from "../../components/Panel.svelte";
  import Segmented from "../../components/Segmented.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Minting } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import {
    everyPurpose,
    everyScope,
    keyLines,
    mintedLines,
    purposeChosen,
    scopeChosen,
    wordOfPurpose,
    type Purpose,
    type ScopeChoice,
  } from "../../lib/keys";
  import type { Keyer } from "../keying.svelte";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What keeping keys asks for, and what came of it. */
    keyer: Keyer;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { keyer, freshness }: Props = $props();

  const mintId = $props.id();
  const madeId = `${mintId}-made`;

  let name = $state("");
  let scope = $state<ScopeChoice>("read");
  let account = $state("");
  let purpose = $state<Purpose>("home-assistant");
  let password = $state("");

  /** The key about to be revoked, asked about before it is. */
  let revoking = $state<string | undefined>(undefined);

  const listing = $derived(
    keyer.listing?.ok === true ? keyer.listing.value : undefined,
  );
  const problem = $derived(
    keyer.listing?.ok === false ? keyer.listing.problem.message : undefined,
  );

  /** The mint as typed, or nothing while any part of it is missing. */
  const typed = $derived.by((): Minting | undefined => {
    const named = name.trim();
    const member = account.trim();
    if (named === "" || password === "") return undefined;
    if (scope !== "member") return { name: named, scope, purpose, password };
    if (member === "") return undefined;
    return { name: named, scope: `member:${member}`, purpose, password };
  });

  /** Mint the key typed, letting go of the password at once. */
  function mint(minting: Minting): void {
    keyer.onask({ doing: "key-mint", minting });
    password = "";
    name = "";
  }
</script>

<!--
  The integration keys, and keeping them. Each key is listed without its
  secret, and an active one can be revoked once the operator says so. Minting
  asks for the operator's password every time; it goes in that one request and
  the field is emptied as it is sent. The key just minted is shown once, with
  its pin and address, and closing it, or reloading, drops its secret.
-->
<Panel title={m.panel_keys()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.keys_prose()} /></p>
    {#if listing === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if listing === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {:else if listing.keys.length === 0}
      <p><Said text={m.keys_none()} /></p>
    {/if}
    {#if listing !== undefined}
      <p>{listing.purposes}</p>
    {/if}
    {#if keyer.listing !== undefined}
      <div class="acts">
        <Action
          label={m.action_keys_list()}
          off={keyer.busy}
          onclick={() => {
            keyer.onask({ doing: "key-list" });
          }}
        />
      </div>
    {/if}
  </div>

  {#if keyer.minted !== undefined}
    <section class="made" aria-labelledby={madeId}>
      <h3 id={madeId}>{m.keys_made_title({ name: keyer.minted.name })}</h3>
      <p><Said text={m.keys_made_prose()} /></p>
      <p class="secret">
        <Value state="known" figure={keyer.minted.secret} />
      </p>
      <ul class="lines">
        {#each mintedLines(keyer.minted) as line, at (at)}
          <li><Said text={line} /></li>
        {/each}
      </ul>
      <div class="acts">
        <Action label={m.action_keys_close()} onclick={keyer.onclose} />
      </div>
    </section>
  {/if}

  {#if listing !== undefined && listing.keys.length > 0}
    <ul class="entries" aria-label={m.keys_said()}>
      {#each listing.keys as key (key.name)}
        <li>
          <h3>{key.name}</h3>
          <ul class="lines">
            {#each keyLines(key) as line, at (at)}
              <li><Said text={line} /></li>
            {/each}
          </ul>
          {#if key.state === "active" && revoking !== key.name}
            <div class="acts">
              <Action
                label={m.action_keys_revoke({ name: key.name })}
                off={keyer.busy}
                onclick={() => {
                  revoking = key.name;
                }}
              />
            </div>
          {/if}
          {#if revoking === key.name}
            <p><Said text={m.keys_revoke_prose({ name: key.name })} /></p>
            <div class="acts">
              <Action
                label={m.action_keys_revoke_yes({ name: key.name })}
                weight="firm"
                off={keyer.busy}
                onclick={() => {
                  keyer.onask({ doing: "key-revoke", name: key.name });
                  revoking = undefined;
                }}
              />
              <Action
                label={m.action_leave_as_is()}
                onclick={() => {
                  revoking = undefined;
                }}
              />
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  <section class="mint" aria-labelledby={mintId}>
    <h3 id={mintId}>{m.keys_mint_title()}</h3>
    <Field
      label={m.keys_name()}
      value={name}
      oninput={(value: string) => {
        name = value;
      }}
    />
    <Segmented
      label={m.keys_scope_said()}
      options={everyScope.map((one) => ({
        value: one,
        label:
          one === "read"
            ? m.keys_scope_read()
            : one === "act"
              ? m.keys_scope_act()
              : m.keys_scope_member(),
      }))}
      selected={scope}
      onselect={(value: string) => {
        scope = scopeChosen(value, scope);
      }}
    />
    {#if scope === "member"}
      <Field
        label={m.keys_account()}
        value={account}
        oninput={(value: string) => {
          account = value;
        }}
      />
    {/if}
    <Segmented
      label={m.keys_purpose_said()}
      options={everyPurpose.map((one) => ({
        value: one,
        label: wordOfPurpose(one),
      }))}
      selected={purpose}
      onselect={(value: string) => {
        purpose = purposeChosen(value, purpose);
      }}
    />
    <Field
      label={m.keys_password()}
      value={password}
      purpose="secret"
      oninput={(value: string) => {
        password = value;
      }}
    />
    <div class="acts">
      {#if typed === undefined}
        <Action label={m.action_keys_mint()} weight="firm" off />
      {/if}
      {#if typed !== undefined}
        {@const minting = typed}
        <Action
          label={m.action_keys_mint()}
          weight="firm"
          off={keyer.busy}
          onclick={() => {
            mint(minting);
          }}
        />
      {/if}
    </div>
    <div role="status" aria-label={m.keys_asked()}>
      {#if keyer.said !== undefined}
        <Value state="unknown" absent={keyer.said} />
      {/if}
    </div>
  </section>
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

  .entries {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entries > li,
  .made,
  .mint {
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

  .secret {
    color: var(--ink);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
