<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Limiting from "./Limiting.svelte";
  import { nameOfRequest } from "../../lib/household";
  import type { Limits, Tender } from "../../lib/tending";
  import type { Member } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The person acted on. */
    member: Member;
    /** What can be asked about them. */
    tender: Tender;
  }

  let { member, tender }: Props = $props();

  /** What is open for them: their limits, or one request being turned down. */
  let open = $state<"limits" | number | undefined>(undefined);

  /** Why a request is being turned down, as typed. */
  let reason = $state("");

  const silent = $derived(tender.busy || tender.asked !== undefined);
  const waiting = $derived(
    member.requests.filter(
      (request) => request.state === "waiting-for-approval",
    ),
  );
</script>

<!--
  What can be done for one person: let each request waiting on the operator
  through, or turn it down with a reason; let them set a new password; and say
  what they may ask for.

  Every control names the request or the person it is about, because a reader
  listing the controls on a screen is given the names and nothing around them.
  What each came to is recorded in the household panel above.
-->
<div class="tended">
  {#if waiting.length > 0}
    <ul class="waiting" aria-label={m.tended_waiting({ name: member.name })}>
      {#each waiting as request (request.id)}
        {@const title = nameOfRequest(request)}
        <li>
          <div class="acts">
            <Action
              label={m.action_approve({ title })}
              off={silent}
              onclick={() => {
                tender.onask({
                  doing: "household-approve",
                  request: request.id,
                  title,
                });
              }}
            />
            <Action
              label={m.action_decline_open({ title })}
              off={silent}
              onclick={() => {
                open = request.id;
                reason = "";
              }}
            />
          </div>
          {#if open === request.id}
            <div class="form">
              <Field
                label={m.decline_reason({ title })}
                value={reason}
                oninput={(value: string) => {
                  reason = value;
                }}
              />
              <div class="acts">
                <Action
                  label={m.action_decline_yes()}
                  weight="firm"
                  off={silent || reason.trim() === ""}
                  onclick={() => {
                    tender.onask({
                      doing: "household-decline",
                      request: request.id,
                      title,
                      reason: reason.trim(),
                    });
                    open = undefined;
                  }}
                />
                <Action
                  label={m.action_leave_as_is()}
                  onclick={() => {
                    open = undefined;
                  }}
                />
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  <div
    class="acts"
    role="group"
    aria-label={m.tended_controls({ name: member.name })}
  >
    <Action
      label={m.action_reissue({ name: member.name })}
      off={silent}
      onclick={() => {
        tender.onask({ doing: "reissue", name: member.name });
      }}
    />
    <Action
      label={m.action_limits_member({ name: member.name })}
      off={silent}
      onclick={() => {
        open = "limits";
      }}
    />
  </div>

  {#if open === "limits"}
    <div class="form">
      <Limiting
        name={member.name}
        policy={member.asking?.policy}
        busy={tender.busy}
        onkeep={(limits: Limits) => {
          tender.onask({ doing: "household-allow", limits });
          open = undefined;
        }}
        onleave={() => {
          open = undefined;
        }}
      />
    </div>
  {/if}
</div>

<style>
  .tended {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
  }

  .waiting {
    display: grid;
    gap: var(--sp-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .form {
    display: grid;
    gap: var(--sp-3);
    margin: var(--sp-2) 0 0;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
