<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Panel from "../../components/Panel.svelte";
  import Revocation from "./Revocation.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Freshness } from "../../lib/freshness";
  import { removedLine, wakeableLines } from "../../lib/woken";
  import type { Keyer } from "../keying.svelte";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What keeping keys and phones asks for, and what came of it. */
    keyer: Keyer;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { keyer, freshness }: Props = $props();

  /** The phone about to stop being woken, asked about before it is. */
  let removing = $state<string | undefined>(undefined);

  const previewed = $derived(
    keyer.previewed?.doing === "push-endpoint-remove"
      ? keyer.previewed
      : undefined,
  );
  const asking = $derived(removing ?? previewed?.name);

  const woken = $derived(
    keyer.woken?.ok === true ? keyer.woken.value : undefined,
  );
  const problem = $derived(
    keyer.woken?.ok === false ? keyer.woken.problem.message : undefined,
  );
  const removed = $derived(removedLine(woken));
</script>

<!--
  The phones that can be woken: each push endpoint a phone registered so the
  stack can wake it, by name, the host it is woken through, the fingerprint of
  its address that tells two phones on one host apart, and when it was
  registered. Whoever holds the whole address can wake the phone, so lemonfiber
  answers only the host and the fingerprint, and only those are drawn. One is
  removed by its name once the operator says yes to a question naming the phone,
  and the question offers a preview of the removal beside the yes, which the yes
  does not wait for. Where the signed-in key may not keep them, lemonfiber's
  sentence says why in place of the list, and nothing can be pressed.
-->
<Panel title={m.panel_woken()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.woken_prose()} /></p>
    {#if woken === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if woken === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {:else if woken.endpoints.length === 0}
      <p><Said text={m.woken_none()} /></p>
    {/if}
    {#if woken !== undefined}
      <div class="acts">
        <Action
          label={m.action_woken_list()}
          off={keyer.busy}
          onclick={() => {
            keyer.onask({ doing: "push-endpoint-list" });
          }}
        />
      </div>
    {/if}
    <div role="status" aria-label={m.woken_asked()}>
      {#if keyer.wokenSaid !== undefined}
        <Value state="unknown" absent={keyer.wokenSaid} />
      {/if}
      {#if removed !== undefined}
        <p><Said text={removed} /></p>
      {/if}
    </div>
  </div>

  {#if woken !== undefined && woken.endpoints.length > 0}
    <ul class="entries" aria-label={m.woken_said()}>
      {#each woken.endpoints as phone (phone.name)}
        <li>
          <h3>{phone.name}</h3>
          <ul class="lines">
            {#each wakeableLines(phone) as line, at (at)}
              <li><Said text={line} /></li>
            {/each}
          </ul>
          {#if asking === phone.name}
            <Revocation
              prose={m.woken_remove_prose({ name: phone.name })}
              yes={m.action_woken_remove_yes({ name: phone.name })}
              preview={m.action_woken_remove_preview({ name: phone.name })}
              revokes="push-endpoint-remove"
              previewed={previewed?.name === phone.name ? previewed : undefined}
              busy={keyer.busy}
              onyes={() => {
                keyer.onask({
                  doing: "push-endpoint-remove",
                  name: phone.name,
                });
                removing = undefined;
              }}
              onpreview={() => {
                keyer.onask({
                  doing: "push-endpoint-remove",
                  name: phone.name,
                  dryRun: true,
                });
                removing = phone.name;
              }}
              onleave={() => {
                removing = undefined;
                keyer.onleave();
              }}
            />
          {:else}
            <div class="acts">
              <Action
                revokes="push-endpoint-remove"
                label={m.action_woken_remove({ name: phone.name })}
                off={keyer.busy}
                onclick={() => {
                  removing = phone.name;
                  keyer.onleave();
                }}
              />
            </div>
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
