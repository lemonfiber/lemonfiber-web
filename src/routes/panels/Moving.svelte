<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import { linesOf } from "../../lib/came";
  import { everyMoving, standingMove, type Mover } from "../../lib/moving";
  import type { Survey } from "../../lib/survey";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What is already on this machine, as last surveyed. */
    survey: Survey;
    /** What acting on it asks for, and what came of it. */
    mover: Mover;
  }

  let { survey, mover }: Props = $props();

  const offerId = $props.id();

  /** The region the records sit in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Put the reader where what they asked for is answered. */
  function landing(): void {
    asked.focus();
  }

  const offered = $derived(
    survey.modes.flatMap((one) => {
      const doing = everyMoving.find((act) => act === `migrate-${one.mode}`);
      return doing === undefined ? [] : [{ mode: one.mode, doing }];
    }),
  );
  const standing = $derived(standingMove(mover.work));
  const parted = $derived(mover.work.length > 0);
  const wordOf = (doing: string): string => doing.replace(/^migrate-/u, "");
</script>

<!--
  Acting on what is already here, one way forward at a time, least disruptive
  first. Each is asked bare first and changes nothing; what it would come to is
  recorded below, and the yes stands under it. Replacing stops what it named,
  so its yes carries the offer that named it.
-->
<div class="moving">
  <div class="acts">
    {#each offered as one (one.doing)}
      <Action
        label={m.action_move_preview({ mode: one.mode })}
        off={mover.busy}
        onclick={() => {
          mover.onask({ doing: one.doing });
          landing();
        }}
      />
    {/each}
  </div>

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.move_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if standing !== undefined}
      {@const mode = wordOf(standing.doing)}
      <section class="plan" aria-labelledby={offerId}>
        <h3 id={offerId}>{m.move_plan_title({ mode })}</h3>
        <p class="prose">
          {standing.doing === "migrate-replace"
            ? m.move_plan_replace()
            : m.move_plan_prose()}
        </p>
        {#if standing.doing === "migrate-adopt" || standing.doing === "migrate-import"}
          <p class="prose">{m.move_plan_backed_up()}</p>
        {/if}
        <div class="acts">
          <Action
            label={m.action_move_yes({ mode })}
            weight="firm"
            off={mover.busy}
            onclick={() => {
              mover.onask(
                standing.doing === "migrate-replace"
                  ? { doing: standing.doing, offer: standing.offer }
                  : { doing: standing.doing, confirm: true },
              );
              landing();
            }}
          />
          <Action
            label={m.action_leave_as_is()}
            onclick={() => {
              mover.ondrop(standing.id);
              landing();
            }}
          />
        </div>
      </section>
    {/if}

    {#each mover.work as one (one.id)}
      {@const said = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            mover.ondrop(one.id);
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
</div>

<style>
  .moving {
    display: grid;
    border-top: 1px solid var(--line);
  }

  .moving > .acts {
    padding: var(--sp-3) var(--panel-pad);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }

  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  /* The rule appears only when there is something under it, so a panel nobody
     has asked anything of ends at its own border rather than at a spare line. */
  .parted {
    border-top: 1px solid var(--line);
  }

  /* Focus is put here after something is asked, and it is not a place the tab
     order stops at, so the ring would mark somewhere nobody steered to. */
  .asked:focus {
    outline: none;
  }

  .plan {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-4) var(--panel-pad);
    border-bottom: 1px solid var(--line);
    overflow-wrap: anywhere;
  }
</style>
