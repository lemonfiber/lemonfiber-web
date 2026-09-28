<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { linesOf } from "../../lib/came";
  import type { Freshness } from "../../lib/freshness";
  import type { Tuned } from "../../lib/tuned";
  import { questionOfTune, standingCost, type Tuner } from "../../lib/tuning";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The choice in force, or why it could not be read. */
    quality: Reading<Tuned> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
    /**
     * What can be asked about the choice. Left out where nothing answers it,
     * which draws the choice alone.
     */
    tuner?: Tuner | undefined;
  }

  let { quality, freshness, tuner }: Props = $props();

  const costId = $props.id();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  const read = $derived(quality?.ok === true ? quality.value : undefined);
  const problem = $derived(
    quality?.ok === false ? quality.problem.message : undefined,
  );
  const work = $derived(tuner?.work ?? []);
  const standing = $derived(standingCost(work));
  const question = $derived(
    tuner?.asked === undefined ? undefined : questionOfTune(tuner.asked),
  );
  const silent = $derived(tuner?.busy === true || question !== undefined);
  const parted = $derived(
    question !== undefined || standing !== undefined || work.length > 0,
  );
</script>

<!--
  The quality new media is fetched at, and what can be asked about it.

  Each choice in force is set out in the stack's own terms: what the preset is
  called, what it means, the resolution it targets, roughly how much disk an
  hour of it takes and what playing it costs. Where this machine would have to
  transcode it in software, the row says so.

  Choosing another preset is not offered here: the reading names the choices
  in force and not the presets there are to choose from.

  Putting the recorded preset back replaces edits made to the config by hand,
  so it is offered only where the reading says there are some, and asked about
  before it is sent. Fetching the library again is read first, which fetches
  nothing and answers with what it would cost, and the yes is under that.
-->
<Panel title={m.panel_quality()} {freshness} flush>
  <div class="scope">
    <p>{m.quality_prose()}</p>
  </div>

  {#if read !== undefined}
    <ul class="choices" aria-label={m.quality_choices()}>
      {#each read.choices as choice (choice.scope)}
        <li class="choice">
          <p class="named">
            {m.quality_choice({ scope: choice.scope, preset: choice.preset })}
          </p>
          <p class="prose">{choice.means}</p>
          <p class="note">
            {m.quality_facts({
              resolution: choice.resolution,
              size: choice.size_per_hour,
              transcoding: choice.transcoding,
            })}
          </p>
          {#if choice.needs_transcoding_here}
            <p class="note">{m.quality_transcodes_here()}</p>
          {/if}
        </li>
      {/each}
      {#if read.music !== undefined && read.music !== null}
        <li class="choice">
          <p class="named">
            {m.quality_music({ format: read.music.format })}
          </p>
          <p class="prose">{read.music.means}</p>
          <p class="note">
            {m.quality_music_facts({
              targets: read.music.targets,
              size: read.music.size_per_hour,
            })}
          </p>
          <p class="note">{read.music.note}</p>
        </li>
      {/if}
    </ul>
    {#if read.customised}
      <div class="scope">
        <p>{m.quality_customised()}</p>
      </div>
    {/if}
  {:else}
    <div class="choices">
      {#if problem !== undefined}
        <Value state="unknown" absent={problem} />
      {:else}
        <Skeleton width="18rem" label={m.waiting_answer()} />
      {/if}
    </div>
  {/if}

  {#if tuner !== undefined}
    <div class="controls" role="group" aria-label={m.quality_controls()}>
      <Action
        label={m.action_upgrade_cost()}
        off={silent}
        onclick={() => {
          tuner.onask({ doing: "quality-upgrade" });
        }}
      />
      {#if read?.customised === true}
        <Action
          label={m.action_reapply()}
          off={silent}
          onclick={() => {
            tuner.onask({ doing: "quality-reapply" });
          }}
        />
      {/if}
    </div>
  {/if}

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.quality_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if tuner !== undefined}
      {#if tuner.asked !== undefined && question !== undefined}
        {@const asking = tuner.asked}
        {#snippet answering()}
          <Action
            label={question.yes}
            weight="firm"
            onclick={() => {
              tuner.onask(asking);
              landing();
            }}
          />
          <Action
            label={m.action_leave_as_is()}
            onclick={() => {
              tuner.onleave();
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

      {#if standing !== undefined}
        <section class="cost" aria-labelledby={costId}>
          <h3 id={costId}>{m.quality_cost_title()}</h3>
          <p class="prose">{m.quality_cost_prose()}</p>
          <div class="controls">
            <Action
              label={m.action_upgrade_yes()}
              weight="firm"
              off={tuner.busy}
              onclick={() => {
                tuner.onask({ doing: "quality-upgrade", confirm: true });
                landing();
              }}
            />
            <Action
              label={m.action_leave_as_is()}
              onclick={() => {
                tuner.ondrop(standing.id);
                landing();
              }}
            />
          </div>
        </section>
      {/if}

      {#each work as one (one.id)}
        {@const said = readingOf(one)}
        {#snippet dropping()}
          <Action
            label={m.action_hide_record()}
            onclick={() => {
              tuner.ondrop(one.id);
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
    {/if}
  </div>
</Panel>

<style>
  .scope {
    padding: var(--sp-4) var(--panel-pad) 0;
  }

  .scope p,
  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .choices {
    display: grid;
    margin: var(--sp-3) 0 0;
    padding: 0;
    list-style: none;
  }

  div.choices {
    padding: 0 var(--panel-pad) var(--sp-3);
  }

  .choice {
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  .named {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-item);
    font-weight: 600;
  }

  .note {
    margin: var(--sp-1) 0 0;
    font-size: var(--text-note);
    color: var(--faint);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
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

  .cost {
    padding: var(--sp-4) 0 0;
    border-bottom: 1px solid var(--line);
  }

  .cost h3,
  .cost > .prose {
    padding: 0 var(--panel-pad);
  }

  h3 {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-item);
    font-weight: 600;
  }
</style>
