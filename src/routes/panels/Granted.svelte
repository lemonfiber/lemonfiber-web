<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import type { Granted } from "../../lib/credentials";
  import type { Revoker } from "../../lib/revoking";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The grant drawn. */
    grant: Granted;
    /** What is said of it. */
    line: string;
    /** What ending it asks for, where this page may act. */
    revoker: Revoker | undefined;
  }

  let { grant, line, revoker }: Props = $props();
</script>

<!--
  One grant of a credential to a plugin, in a line, and where acting is given
  the control that reads what ending it would do.
-->
<li>
  <Said text={line} />
  {#if revoker !== undefined}
    {@const acting = revoker}
    <Action
      label={m.action_grant_revoke({
        plugin: grant.plugin,
        credential: grant.credential,
      })}
      off={acting.busy}
      onclick={() => {
        acting.onask({
          doing: "credentials-revoke",
          plugin: grant.plugin,
          credential: grant.credential,
        });
      }}
    />
  {/if}
</li>

<style>
  li {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    align-items: center;
    justify-content: space-between;
    font-size: var(--text-prose);
    color: var(--muted);
  }
</style>
