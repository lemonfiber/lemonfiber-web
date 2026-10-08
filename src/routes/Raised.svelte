<script lang="ts">
  import Action from "../components/Action.svelte";
  import Banner from "../components/Banner.svelte";
  import { toneOfAlert, wordOfWay } from "../lib/trouble";
  import type { Alert } from "../lib/wire";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** The alert the stream just said start or end. */
    told: Alert;
    /** Put it away. */
    ondismiss: () => void;
  }

  let { told, ondismiss }: Props = $props();
</script>

<!--
  An alert the moment the stream says it started or ended, over whichever
  screen is open, so the operator hears of it without going to the overview.
  An alarm interrupts; anything quieter waits for the reader to pause. It says
  what happened, what it means and the most likely thing to do, and stays until
  it is put away or the next one replaces it. The overview's own list is where
  every alert is kept.
-->
{#snippet putting()}
  <Action label={m.action_told_dismiss()} onclick={ondismiss} />
{/snippet}
<div class="raised">
  <Banner
    tone={toneOfAlert(told)}
    lead={m.told_live_lead({
      way: wordOfWay(told.moment),
      summary: told.summary,
    })}
    prose={[told.meaning, ...told.remedies.slice(0, 1)].join(" ")}
    actions={putting}
  />
</div>

<style>
  .raised {
    margin-bottom: var(--sp-4);
  }
</style>
