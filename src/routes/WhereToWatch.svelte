<script lang="ts">
  import Code from "../components/Code.svelte";
  import Panel from "../components/Panel.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import Value from "../components/Value.svelte";
  import { saidNo, type Heard } from "../api/member";
  import type { Freshness } from "../lib/freshness";
  import { nowhereOf, waysOf, type Door } from "../lib/ways";
  import * as m from "../paraglide/messages.js";

  interface Props {
    door: Heard<Door> | undefined;
  }

  let { door }: Props = $props();

  const UNSTAMPED: Freshness = { kind: "never" };
</script>

<!--
  Where a member goes to watch and to ask, in the household's words.

  Each place is what lemonfiber said it is to them, with its address as a link
  and as a code a phone can scan. An address that does not answer from where
  they are is left out, and what lemonfiber said in its place is said instead.
-->
<Panel stamped="quiet" title={m.member_door_title()} freshness={UNSTAMPED}>
  {#if door === undefined}
    <Skeleton width="14rem" label={m.waiting_answer()} />
  {:else if door.at === "answered"}
    {@const nowhere = nowhereOf(door.value)}
    {#if nowhere !== undefined}
      <p class="line"><span class="word">{nowhere}</span></p>
    {/if}
    <ul class="ways">
      {#each waysOf(door.value) as way (way.key)}
        <li class="way">
          <p class="name"><span class="word">{way.service}</span></p>
          <p class="line"><span class="word">{way.said}</span></p>
          {#if way.url !== undefined}
            <p class="line">
              <a class="open" href={way.url}>
                {m.member_door_open({ service: way.service })}
              </a>
            </p>
            <div class="code">
              <Code
                text={way.url}
                label={m.member_door_code({ service: way.service })}
              />
            </div>
          {:else if way.unaddressed !== undefined}
            <p class="line"><span class="word">{way.unaddressed}</span></p>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <Value state="unknown" absent={saidNo(door) ?? m.member_door_unread()} />
  {/if}
</Panel>

<style>
  .ways {
    display: grid;
    gap: var(--sp-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .way {
    display: grid;
    gap: var(--sp-2);
  }

  .name {
    margin: 0;
    font-weight: 600;
    font-size: var(--text-prose);
  }

  .line {
    margin: 0;
    max-width: 62ch;
    font-size: var(--text-prose);
    color: var(--text);
  }

  .code {
    width: 9rem;
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
