<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Segmented from "../../components/Segmented.svelte";
  import { everyPolicy, labelOfPolicy } from "../../lib/household";
  import { policyChosen, quotaTyped, type Limits } from "../../lib/tending";
  import type { Policy } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Whose limits, or nobody's in particular for the whole house. */
    name: string | undefined;
    /** The policy in force, which the choice starts from. */
    policy: Policy | null | undefined;
    /** Whether a request is in flight, which silences the yes. */
    busy: boolean;
    /** What keeping the limits chosen asks for. */
    onkeep: (limits: Limits) => void;
    /** What leaving them as they are asks for. */
    onleave: () => void;
  }

  let { name, policy, busy, onkeep, onleave }: Props = $props();

  /**
   * The policy in force when the form was opened, which the choice starts
   * from. The form is drawn anew each time it is opened, so it is read once.
   */
  function inForce(): Policy {
    return policyChosen(policy, "trusted");
  }

  /** The policy chosen. */
  let chosen = $state<Policy>(inForce());

  /** How many requests a period allows, as typed. */
  let requests = $state("");

  /** How many days a period lasts, as typed. */
  let days = $state("");

  const limited = $derived(chosen === "within-a-limit");
  const typed = $derived(
    limited ? quotaTyped(requests, days) : { quota: undefined },
  );
</script>

<!--
  What somebody, or the whole house, may ask for.

  The policy is one choice of three. A limit is a number of requests over a
  number of days, and is asked for only where the policy is the one that limits:
  the other two would carry a number nothing reads. Both numbers go, or
  neither; while only one is typed, or either is not a count, nothing is sent.
-->
<div class="limits">
  <Segmented
    label={name === undefined
      ? m.limits_policy_house()
      : m.limits_policy_member({ name })}
    options={everyPolicy.map((one) => ({
      value: one,
      label: labelOfPolicy(one),
    }))}
    selected={chosen}
    onselect={(value: string) => {
      chosen = policyChosen(value, chosen);
    }}
  />
  {#if limited}
    <div class="quota">
      <Field
        label={m.limits_requests()}
        value={requests}
        figure
        oninput={(value: string) => {
          requests = value;
        }}
      />
      <Field
        label={m.limits_days()}
        value={days}
        figure
        hint={typed === undefined ? m.limits_unread() : m.limits_hint()}
        oninput={(value: string) => {
          days = value;
        }}
      />
    </div>
  {/if}
  <div class="acts">
    {#if typed === undefined}
      <Action label={m.action_limits_keep()} weight="firm" off />
    {:else}
      {@const quota = typed.quota}
      <Action
        label={m.action_limits_keep()}
        weight="firm"
        off={busy}
        onclick={() => {
          onkeep({ name, policy: chosen, quota });
        }}
      />
    {/if}
    <Action label={m.action_leave_as_is()} onclick={onleave} />
  </div>
</div>

<style>
  .limits {
    display: grid;
    gap: var(--sp-3);
  }

  .quota {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: var(--sp-3);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
