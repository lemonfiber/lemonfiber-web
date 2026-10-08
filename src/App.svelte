<script lang="ts">
  import { untrack } from "svelte";
  import Setup from "./routes/Setup.svelte";
  import Member from "./routes/Member.svelte";
  import Unlock from "./routes/Unlock.svelte";
  import type { Fetching, Sending } from "@lemonfiber/sdk-ts";
  import { admitting, type Offered } from "./api/admitting";
  import { forget, memberOf, remember, remembered } from "./api/token";

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
  let member = $state<string | undefined>(untrack(() => memberOf(store)));
  let refused = $state(false);
  let said = $state<string | undefined>(undefined);

  /**
   * Put away whatever was drawn, and ask at the door again.
   *
   * What lemonfiber said is carried where it said something a member can
   * read; the console's refusals are the key's, and the door says that itself.
   */
  function turnedAway(words?: string): void {
    forget(store);
    token = undefined;
    member = undefined;
    refused = true;
    said = words;
  }
</script>

<!--
  Either the page is carrying something this run takes, or it is asking for it.

  What it draws once it carries something follows from who the door said signed
  in: the operator's console for the key and the operator's own password, and a
  household member's own surface for a member. Nothing else chooses between them
  — not the address, not a setting, and not a build — and neither surface is a
  permission. lemonfiber decides what each request may have from the session it
  carries.

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
    {said}
    onsignin={(offered: Offered) => admitting({ at, sending }, offered)}
    onopen={(given: string, whose?: string) => {
      remember(store, given, whose);
      token = given;
      member = whose;
    }}
  />
{:else if member === undefined}
  <Setup reaching={{ at, token, sending, fetching }} onrefused={turnedAway} />
{:else}
  <Member
    reaching={{ at, token, sending, fetching }}
    {member}
    onrefused={turnedAway}
  />
{/if}
