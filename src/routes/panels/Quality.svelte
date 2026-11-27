<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Segmented from "../../components/Segmented.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { linesOf } from "../../lib/came";
  import type { Freshness } from "../../lib/freshness";
  import type { Tuned } from "../../lib/tuned";
  import {
    MUSIC,
    standingChoice,
    standingCost,
    standingReapply,
    type Tuner,
  } from "../../lib/tuning";
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
  const choiceId = `${costId}-choice`;
  const reapplyId = `${costId}-reapply`;

  /** What a choice applies to when it is not one kind of media. */
  const EVERYTHING = "";

  /** Whether a choice is being made. */
  let choosing = $state(false);
  /** The kind of media chosen for, or everything. */
  let scope = $state(EVERYTHING);
  /** The preset or format chosen, or none yet. */
  let preset = $state("");

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
  const weighed = $derived(standingChoice(work));
  const replacing = $derived(standingReapply(work));
  const silent = $derived(tuner?.busy === true);
  const parted = $derived(work.length > 0);

  /** What a choice for one scope may be made from, as the reading offers it. */
  function offeredFor(tuned: Tuned, chosen: string): readonly string[] {
    return chosen === MUSIC ? tuned.offered.formats : tuned.offered.presets;
  }
</script>

<!--
  The quality new media is fetched at, and what can be asked about it.

  Each choice in force is set out in the stack's own terms: what the preset is
  called, what it means, the resolution it targets, roughly how much disk an
  hour of it takes and what playing it costs. Where this machine would have to
  transcode it in software, the row says so.

  Choosing another quality offers what the reading offers and nothing else:
  a preset for everything or for one kind of media, or a format for music.
  The choice is read first, and the yes is under what it would come to; where
  the stack held it for transcoding this machine cannot do well, the yes says
  it is chosen anyway.

  Putting the recorded preset back replaces edits made to the config by hand,
  so it is offered only where the reading says there are some, and read first:
  the record names each file it would replace with the lines that go and the
  lines that land, and the yes is under that. Fetching the library again is
  read first too, which fetches nothing and answers with what it would cost.
-->
<Panel
  title={m.panel_quality()}
  {freshness}
  reads="quality"
  answer={quality}
  flush
>
  <div class="scope">
    <p><Said text={m.quality_prose()} /></p>
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
            <p class="note"><Said text={m.quality_transcodes_here()} /></p>
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
        <p><Said text={m.quality_customised()} /></p>
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
      {#if read !== undefined}
        <Action
          acts="quality-set"
          label={m.action_quality_choose()}
          off={silent}
          onclick={() => {
            choosing = !choosing;
          }}
        />
      {/if}
      <Action
        acts="quality-upgrade"
        label={m.action_upgrade_cost()}
        off={silent}
        onclick={() => {
          tuner.onask({ doing: "quality-upgrade" });
        }}
      />
      {#if read?.customised === true}
        <Action
          acts="quality-reapply"
          label={m.action_reapply()}
          off={silent}
          onclick={() => {
            tuner.onask({ doing: "quality-reapply", rehearse: true });
          }}
        />
      {/if}
    </div>
    {#if choosing && read !== undefined}
      <div class="chooser" role="group" aria-label={m.quality_chooser()}>
        <Segmented
          label={m.quality_for()}
          options={[
            { value: EVERYTHING, label: m.quality_for_everything() },
            ...read.offered.media_types.map((one) => ({
              value: one,
              label: one,
            })),
          ]}
          selected={scope}
          onselect={(value: string) => {
            scope = value;
            preset = "";
          }}
        />
        <Segmented
          label={m.quality_at()}
          options={offeredFor(read, scope).map((one) => ({
            value: one,
            label: one,
          }))}
          selected={preset}
          onselect={(value: string) => {
            preset = value;
          }}
        />
        <div>
          <Action
            acts="quality-set"
            label={m.action_quality_read()}
            off={silent || preset === ""}
            onclick={() => {
              tuner.onask({
                doing: "quality-set",
                rehearse: true,
                preset,
                media_type: scope === EVERYTHING ? undefined : scope,
              });
              choosing = false;
            }}
          />
        </div>
      </div>
    {/if}
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
      {#if weighed !== undefined}
        {@const choice = weighed}
        <section class="cost" aria-labelledby={choiceId}>
          <h3 id={choiceId}>{m.quality_choice_title()}</h3>
          <p class="prose">
            <Said
              text={choice.held
                ? m.quality_choice_held()
                : m.quality_choice_prose()}
            />
          </p>
          <div class="controls">
            <Action
              acts="quality-set"
              label={choice.held
                ? m.action_quality_anyway()
                : m.action_quality_use()}
              weight="firm"
              off={tuner.busy}
              onclick={() => {
                tuner.onask({
                  doing: "quality-set",
                  preset: choice.preset,
                  media_type: choice.media_type,
                  confirm: choice.held,
                });
                landing();
              }}
            />
            <Action
              label={m.action_leave_as_is()}
              onclick={() => {
                tuner.ondrop(choice.id);
                landing();
              }}
            />
          </div>
        </section>
      {/if}

      {#if replacing !== undefined}
        {@const record = replacing}
        <section class="cost" aria-labelledby={reapplyId}>
          <h3 id={reapplyId}>{m.quality_reapply_title()}</h3>
          <p class="prose"><Said text={m.quality_reapply_prose()} /></p>
          <div class="controls">
            <Action
              acts="quality-reapply"
              label={m.action_reapply_yes()}
              weight="firm"
              off={tuner.busy}
              onclick={() => {
                tuner.onask({ doing: "quality-reapply" });
                landing();
              }}
            />
            <Action
              label={m.action_leave_as_is()}
              onclick={() => {
                tuner.ondrop(record);
                landing();
              }}
            />
          </div>
        </section>
      {/if}

      {#if standing !== undefined}
        <section class="cost" aria-labelledby={costId}>
          <h3 id={costId}>{m.quality_cost_title()}</h3>
          <p class="prose"><Said text={m.quality_cost_prose()} /></p>
          <div class="controls">
            <Action
              acts="quality-upgrade"
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

  .chooser {
    display: grid;
    gap: var(--sp-3);
    padding: 0 var(--panel-pad) var(--sp-3);
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
