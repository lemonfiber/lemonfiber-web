<script lang="ts">
  import { untrack } from "svelte";
  import Console from "./routes/Console.svelte";
  import Unlock from "./routes/Unlock.svelte";
  import type { Fetching, Sending } from "@lemonfiber/sdk-ts";
  import { admitting, type Offered } from "./api/admitting";
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
  Either the page is carrying something this run takes, or it is asking for it.

  Two things open it and both travel in the same header, so everything above the
  door holds one thing rather than two. A key is minted once per run; a session
  is exchanged for a password and lasts until it runs out or the password behind
  it changes. Whether either is still good is the run's answer alone — a page
  keeping its own copy of when a session ends would be a second opinion about
  who is admitted.

  A refusal is not something to retry with the same thing: whatever the page was
  holding, the run has stopped taking it. It is forgotten, and the door is
  asked again.

  Which of the two reasons this screen is here is carried with it. A console
  replaced mid-read leaves a reader looking at a screen they did not ask for,
  and one who cannot see it is told nothing at all unless the new screen says
  what happened.
-->
{#if token === undefined}
  <Unlock
    {refused}
    onsignin={(offered: Offered) => admitting({ at, sending }, offered)}
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
