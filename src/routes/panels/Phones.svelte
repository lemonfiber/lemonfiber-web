<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Panel from "../../components/Panel.svelte";
  import Revocation from "./Revocation.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Freshness } from "../../lib/freshness";
  import { phoneLines, revokedLine, standing } from "../../lib/phones";
  import type { Keyer } from "../keying.svelte";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What keeping keys asks for, and what came of it. */
    keyer: Keyer;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { keyer, freshness }: Props = $props();

  /** The phone whose key is about to be revoked, asked about before it is. */
  let revoking = $state<string | undefined>(undefined);

  const previewed = $derived(
    keyer.previewed?.doing === "device-key-revoke"
      ? keyer.previewed
      : undefined,
  );
  const asking = $derived(revoking ?? previewed?.name);

  const phones = $derived(
    keyer.phones?.ok === true ? keyer.phones.value : undefined,
  );
  const problem = $derived(
    keyer.phones?.ok === false ? keyer.phones.problem.message : undefined,
  );
  const revoked = $derived(revokedLine(phones));
</script>

<!--
  The phones' hardware keys: each key pair a phone made and keeps, registered so
  the phone can prove the operator when a key is minted. Each is listed with the
  app that made it, its fingerprint, where the phone keeps it, and when it was
  registered and last used. One still standing can be revoked once the operator
  says yes to a question naming the phone; the keys it proved stay. The question
  offers a preview of the revocation beside the yes, which the yes does not wait
  for. Where the signed-in key may not keep them, lemonfiber's sentence says why
  in place of the list, and nothing can be pressed.
-->
<Panel title={m.panel_phones()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.phones_prose()} /></p>
    {#if phones === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if phones === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {:else if phones.keys.length === 0}
      <p><Said text={m.phones_none()} /></p>
    {/if}
    {#if phones !== undefined}
      <div class="acts">
        <Action
          label={m.action_phones_list()}
          off={keyer.busy}
          onclick={() => {
            keyer.onask({ doing: "device-key-list" });
          }}
        />
      </div>
    {/if}
    <div role="status" aria-label={m.phones_asked()}>
      {#if keyer.phoneSaid !== undefined}
        <Value state="unknown" absent={keyer.phoneSaid} />
      {/if}
      {#if revoked !== undefined}
        <p><Said text={revoked} /></p>
      {/if}
    </div>
  </div>

  {#if phones !== undefined && phones.keys.length > 0}
    <ul class="entries" aria-label={m.phones_said()}>
      {#each phones.keys as phone (phone.name)}
        <li>
          <h3>{phone.name}</h3>
          <ul class="lines">
            {#each phoneLines(phone) as line, at (at)}
              <li><Said text={line} /></li>
            {/each}
          </ul>
          {#if standing(phone) && asking !== phone.name}
            <div class="acts">
              <Action
                revokes="device-key-revoke"
                label={m.action_phones_revoke({ name: phone.name })}
                off={keyer.busy}
                onclick={() => {
                  revoking = phone.name;
                  keyer.onleave();
                }}
              />
            </div>
          {/if}
          {#if asking === phone.name}
            <Revocation
              prose={m.phones_revoke_prose({ name: phone.name })}
              yes={m.action_phones_revoke_yes({ name: phone.name })}
              preview={m.action_phones_revoke_preview({ name: phone.name })}
              revokes="device-key-revoke"
              previewed={previewed?.name === phone.name ? previewed : undefined}
              busy={keyer.busy}
              onyes={() => {
                keyer.onask({ doing: "device-key-revoke", name: phone.name });
                revoking = undefined;
              }}
              onpreview={() => {
                keyer.onask({
                  doing: "device-key-revoke",
                  name: phone.name,
                  dryRun: true,
                });
                revoking = phone.name;
              }}
              onleave={() => {
                revoking = undefined;
                keyer.onleave();
              }}
            />
          {/if}
        </li>
      {/each}
    </ul>
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

  .entries {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entries > li {
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

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
