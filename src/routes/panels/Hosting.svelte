<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { linesOf } from "../../lib/came";
  import type { Freshness } from "../../lib/freshness";
  import {
    actOf,
    guardsForms,
    questionOfHost,
    type Command,
    type Hoster,
  } from "../../lib/hosting";
  import { commandLines, type Hosted } from "../../lib/removed";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What this machine keeps running, or why it could not be read. */
    hosted: Reading<Hosted> | undefined;
    /** The forms chosen on the overview, which the guard is started against. */
    chosen: readonly string[];
    /** What keeping one running, or stopping, asks for, and what came of it. */
    hoster: Hoster;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { hosted, chosen, hoster, freshness }: Props = $props();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  /** Whether a command is the guard, and there are no forms for it to guard. */
  function unguarded(command: Command): boolean {
    return guardsForms(command) && chosen.length === 0;
  }

  const report = $derived(hosted?.ok === true ? hosted.value : undefined);
  const problem = $derived(
    hosted?.ok === false ? hosted.problem.message : undefined,
  );
  const question = $derived(
    hoster.asked === undefined ? undefined : questionOfHost(hoster.asked),
  );
  const silent = $derived(hoster.busy || hoster.asked !== undefined);
  const parted = $derived(question !== undefined || hoster.work.length > 0);
</script>

<!--
  What this machine keeps running when no terminal is open, and keeping one
  running or taking it back.

  The reading is what is read before either: what each command does while it
  runs, the command itself, and where it stands. Both change the machine and
  nothing comes back to read first, so each is asked about before it is sent.
  The guard is started against the forms chosen on this screen, and waits for
  a choice.
-->
<Panel title={m.panel_hosting()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.hosting_prose()} /></p>
    {#if report !== undefined}
      {#each [report.caveat, report.instruction] as said, at (at)}
        {#if said !== undefined && said !== null}
          <p>{said}</p>
        {/if}
      {/each}
    {:else if problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {/if}
  </div>

  {#if report !== undefined}
    <ul class="commands" aria-label={m.hosting_said()}>
      {#each report.commands as command (command.name)}
        {@const act = actOf(command)}
        <li>
          <h3>{command.name}</h3>
          <ul class="lines">
            {#each commandLines(command) as line, at (at)}
              <li><Said text={line} /></li>
            {/each}
          </ul>
          {#if act === "hosting-install" && unguarded(command)}
            <p class="hint"><Said text={m.hosting_choose_forms()} /></p>
            <Action label={m.action_host({ name: command.name })} off />
          {:else if act === "hosting-install"}
            <Action
              label={m.action_host({ name: command.name })}
              off={silent}
              onclick={() => {
                hoster.onask({ doing: act, command, forms: [...chosen] });
                landing();
              }}
            />
          {:else if act === "hosting-remove"}
            <Action
              label={m.action_unhost({ name: command.name })}
              off={silent}
              onclick={() => {
                hoster.onask({ doing: act, command });
                landing();
              }}
            />
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.hosting_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if hoster.asked !== undefined && question !== undefined}
      {@const asking = hoster.asked}
      {#snippet answering()}
        <Action
          label={question.yes}
          weight="firm"
          onclick={() => {
            hoster.onask(asking);
            landing();
          }}
        />
        <Action
          label={m.action_leave_as_is()}
          onclick={() => {
            hoster.onleave();
            landing();
          }}
        />
      {/snippet}
      <Item
        state="stopped"
        eyebrow={question.eyebrow}
        title={question.title}
        prose={question.prose}
        actions={answering}
      />
    {/if}

    {#each hoster.work as one (one.id)}
      {@const said = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            hoster.ondrop(one.id);
            landing();
          }}
        />
      {/snippet}
      <Item
        state={said.state}
        eyebrow={said.eyebrow}
        title={titleOfDoing(one.doing, one.scoped)}
        prose={said.prose}
        lines={one.at === "done"
          ? { named: m.came_heading(), said: linesOf(one.came) }
          : undefined}
        actions={dropping}
      />
    {/each}
  </div>
</Panel>

<style>
  .scope {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--panel-pad) var(--sp-3);
  }

  .scope p,
  .hint {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .commands {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .commands > li {
    display: grid;
    gap: var(--sp-2);
    justify-items: start;
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
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
    overflow-wrap: anywhere;
  }

  /* The rule appears only when there is something under it, so a panel nobody
     has asked anything of ends at its own border rather than at a spare line. */
  .parted {
    border-top: 1px solid var(--line);
  }

  /* Focus is put here after a row is taken away, and it is not a place the tab
     order stops at, so the ring would mark somewhere nobody steered to. */
  .asked:focus {
    outline: none;
  }
</style>
