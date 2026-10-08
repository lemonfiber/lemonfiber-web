<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Switch from "../../components/Switch.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { linesOf } from "../../lib/came";
  import {
    originWords,
    type Configured,
    type Setting,
  } from "../../lib/configured";
  import { standingChange, type Configurer } from "../../lib/configuring";
  import type { Freshness } from "../../lib/freshness";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Every setting, or why they could not be read. */
    settings: Reading<Configured> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
    /**
     * What can be asked about the settings. Left out where nothing answers
     * it, which draws the settings alone.
     */
    configurer?: Configurer | undefined;
  }

  let { settings, freshness, configurer }: Props = $props();

  const reviewId = $props.id();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** The setting being given a new value, where one is. */
  let editing = $state<Setting | undefined>(undefined);

  /** The value typed for it. */
  let typed = $state("");

  /** Whether what is still coming down is let finish before the change. */
  let wait = $state(false);

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  /** Start giving a setting a new value, from the one in force. */
  function edit(setting: Setting): void {
    editing = setting;
    typed = setting.secret ? "" : setting.value;
  }

  const listed = $derived(
    settings?.ok === true ? settings.value.settings : undefined,
  );
  const problem = $derived(
    settings?.ok === false ? settings.problem.message : undefined,
  );
  const work = $derived(configurer?.work ?? []);
  const standing = $derived(standingChange(work));
  const silent = $derived(configurer?.busy === true);
  const parted = $derived(standing !== undefined || work.length > 0);
</script>

<!--
  Every setting lemonfiber keeps, where each value came from, and changing one.

  A setting is changed by giving it a value and asking. lemonfiber decides
  whether the change costs something: one that does not is made at once, and
  one that does comes back as a review — the value in force against the one
  proposed, and everything the change stops, keeps, asks for or interrupts —
  with nothing written. The yes under the review is the same change, confirmed.
  Where the review says something is still coming down, the yes carries
  whether it is let finish first.

  A value that is withheld is not put in the box. Changing a credential is
  typing a new one, and lemonfiber proves it before the old one goes.
-->
<Panel title={m.panel_config()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.config_prose()} /></p>
  </div>

  {#if listed !== undefined}
    <ul class="settings" aria-label={m.config_settings()}>
      {#each listed as setting (setting.key)}
        <li class="setting">
          <div class="row">
            <div class="words">
              <p class="key">{setting.key}</p>
              <p class="prose">{setting.value}</p>
              <p class="note">{originWords(setting.origin)}</p>
            </div>
            {#if configurer !== undefined}
              <Action
                label={m.action_config_edit({ key: setting.key })}
                off={silent}
                onclick={() => {
                  edit(setting);
                }}
              />
            {/if}
          </div>
          {#if configurer !== undefined && editing?.key === setting.key}
            {@const changing = editing}
            <div class="editor">
              <Field
                label={m.config_new_value({ key: changing.key })}
                value={typed}
                purpose={changing.secret ? "secret" : undefined}
                oninput={(value: string) => {
                  typed = value;
                }}
              />
              <div class="acts">
                <Action
                  label={m.action_config_change()}
                  weight="firm"
                  off={silent}
                  onclick={() => {
                    configurer.onask({
                      doing: "config-set",
                      key: changing.key,
                      value: typed,
                    });
                    editing = undefined;
                    wait = false;
                    landing();
                  }}
                />
                <Action
                  label={m.action_leave_as_is()}
                  onclick={() => {
                    editing = undefined;
                  }}
                />
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <div class="settings">
      {#if problem !== undefined}
        <Value state="unknown" absent={problem} />
      {:else}
        <Skeleton width="18rem" label={m.waiting_answer()} />
      {/if}
    </div>
  {/if}

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.config_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if configurer !== undefined}
      {#if standing !== undefined}
        <section class="review" aria-labelledby={reviewId}>
          <h3 id={reviewId}>{m.config_review_title({ key: standing.key })}</h3>
          <p class="prose"><Said text={m.config_review_prose()} /></p>
          {#if standing.interrupts}
            <div class="choice">
              <p class="prose"><Said text={m.config_wait()} /></p>
              <Switch
                on={wait}
                label={m.config_wait()}
                onclick={() => {
                  wait = !wait;
                }}
              />
            </div>
          {/if}
          <div class="acts">
            <Action
              label={m.action_config_yes({ key: standing.key })}
              weight="firm"
              off={silent}
              onclick={() => {
                configurer.onask({
                  doing: "config-set",
                  key: standing.key,
                  value: standing.value,
                  confirm: true,
                  wait,
                });
                landing();
              }}
            />
            <Action
              label={m.action_leave_as_is()}
              onclick={() => {
                configurer.ondrop(standing.id);
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
              configurer.ondrop(one.id);
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

  .settings {
    display: grid;
    margin: var(--sp-3) 0 0;
    padding: 0;
    list-style: none;
  }

  div.settings {
    padding: 0 var(--panel-pad) var(--sp-3);
  }

  .setting {
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
  }

  .row,
  .choice {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-4);
    align-items: center;
  }

  .words {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .key {
    margin: 0 0 var(--sp-1);
    font-family: var(--mono);
    font-size: var(--text-note);
    font-weight: 600;
  }

  .note {
    margin: var(--sp-1) 0 0;
    font-size: var(--text-note);
    color: var(--faint);
  }

  .editor {
    display: grid;
    gap: var(--sp-3);
    margin: var(--sp-3) 0 0;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
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

  .review {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-4) var(--panel-pad);
    border-bottom: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }
</style>
