<script lang="ts">
  import Choice from "../components/Choice.svelte";
  import Panel from "../components/Panel.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import Value from "../components/Value.svelte";
  import { saidNo, type Heard } from "../api/member";
  import type { Freshness } from "../lib/freshness";
  import { phoneOf, type Telling } from "../lib/telling";
  import type { Choosing } from "./hearing.svelte";
  import * as m from "../paraglide/messages.js";

  interface Props {
    telling: Heard<Telling> | undefined;
    choosing?: Choosing | undefined;
    ontick: (id: string) => void;
  }

  let { telling, choosing, ontick }: Props = $props();

  const UNSTAMPED: Freshness = { kind: "never" };

  const unchosen = $derived(
    choosing === undefined || choosing === "sending"
      ? undefined
      : (saidNo(choosing) ?? m.member_tell_unchosen()),
  );
</script>

<!--
  How a member is told that something they asked for is here: each way whoever
  runs the house offers, by the name the house knows it by, switched on where
  they are told on it, and whether their own phone is set up to be told.

  A switch shows what lemonfiber last answered, and moves once it answers
  again. A choice that did not go through is said so, and nothing moved.
-->
<Panel stamped="quiet" title={m.member_tell_title()} freshness={UNSTAMPED}>
  {#if telling === undefined}
    <Skeleton width="14rem" label={m.waiting_answer()} />
  {:else if telling.at === "answered"}
    <p class="line"><span class="word">{m.member_tell_lead()}</span></p>
    {#if telling.value.offered.length > 0}
      <ul class="ways" aria-busy={choosing === "sending"}>
        {#each telling.value.offered as way (way.id)}
          <li>
            <Choice
              words={way.name}
              on={way.receiving}
              onclick={() => {
                ontick(way.id);
              }}
            />
          </li>
        {/each}
      </ul>
    {:else}
      <p class="line"><span class="word">{m.member_tell_none()}</span></p>
    {/if}
    {#if unchosen !== undefined}
      <Value state="unknown" absent={unchosen} />
    {/if}
    <p class="line"><span class="word">{phoneOf(telling.value)}</span></p>
  {:else}
    <Value state="unknown" absent={saidNo(telling) ?? m.member_tell_unread()} />
  {/if}
</Panel>

<style>
  .ways {
    display: grid;
    gap: var(--sp-3);
    margin: var(--sp-3) 0;
    padding: 0;
    list-style: none;
  }

  .line {
    margin: 0;
    max-width: 62ch;
    font-size: var(--text-prose);
    color: var(--text);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
