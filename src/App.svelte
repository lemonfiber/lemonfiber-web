<script lang="ts">
  import { untrack } from "svelte";
  import Console from "./routes/Console.svelte";
  import Unlock from "./routes/Unlock.svelte";
  import type { Fetching, Sending } from "@lemonfiber/sdk-ts";
  import { forget, remember, remembered } from "./api/token";

  interface Props {
    /** Where lemonfiber is listening: the address this page was served from. */
    at: string;
    /** Where the key is kept for as long as this tab is open. */
    store: Storage;
    sending: Sending;
    fetching: Fetching;
  }

  let { at, store, sending, fetching }: Props = $props();

  // Read once. Where the key is kept is settled before the page draws, and a
  // page that re-read it would take back a key the run has since refused.
  let token = $state<string | undefined>(untrack(() => remembered(store)));
  let refused = $state(false);
</script>

<!--
  Either the page has this run's key or it is asking for it.

  A refusal is not something to retry: a key is minted once per run, so a page
  holding one the server will not take is holding one from a run that has ended.
  It is forgotten, and the operator is asked for the current one.

  Which of the two reasons this screen is here is carried with it. A console
  replaced mid-read leaves a reader looking at a screen they did not ask for,
  and one who cannot see it is told nothing at all unless the new screen says
  what happened.
-->
{#if token === undefined}
  <Unlock
    {refused}
    onopen={(given: string) => {
      remember(store, given);
      token = given;
    }}
  />
{:else}
  <Console
    reaching={{ at, token, sending, fetching }}
    onrefused={() => {
      forget(store);
      token = undefined;
      refused = true;
    }}
  />
{/if}
