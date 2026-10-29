<script lang="ts">
  import ShowAll from "../../components/ShowAll.svelte";
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import {
    readerWords,
    secretWords,
    whoseWords,
    type Values,
  } from "../../lib/values";
  import type { Valuer } from "../../lib/valuing";
  import { waitingWords } from "../../lib/waiting";
  import { Shortening } from "../../lib/shortening.svelte";
  import Valued from "./Valued.svelte";
  import Valuing from "./Valuing.svelte";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Every setting and secret the services read, or why they could not be read. */
    values: Reading<Values> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
    /** What changing the settings asks for, where this page may act. */
    valuer?: Valuer | undefined;
  }

  let { values, freshness, valuer }: Props = $props();

  const heldId = $props.id();
  const draftId = `${heldId}-draft`;
  const clearingId = `${heldId}-clearing`;
  const secretsId = `${heldId}-secrets`;

  /** The change being put together: each setting, to the value it is given. */
  let draft = $state<Readonly<Record<string, string>>>({});

  /** The values being taken away, each by its setting's name. */
  let clearing = $state<readonly string[]>([]);

  /** Take one setting out of the values being given. */
  function undraft(setting: string): void {
    draft = Object.fromEntries(
      Object.entries(draft).filter(([named]) => named !== setting),
    );
  }

  /** Take one setting out of the values being taken away. */
  function unclear(setting: string): void {
    clearing = clearing.filter((named) => named !== setting);
  }

  const report = $derived(values?.ok === true ? values.value : undefined);
  const problem = $derived(
    values?.ok === false ? values.problem.message : undefined,
  );
  const drafted = $derived(Object.entries(draft));

  /** Whether the list is shown whole. */
  const short = new Shortening();
</script>

<!--
  Every setting the services read from the operator rather than from their
  manifests, every service held back until it is given what it needs, and
  every secret they read, named without its value.

  Where acting is given, values to give are put into one change and read
  together, so settings whose choices depend on each other move at once, and
  values the operator recorded are put among those taken away and read
  together the same way. What each would do is read first and agreed to under
  the name its reading gave itself. A secret is entered when the plugin that
  needs it is installed and replaced at the terminal, so nothing here takes
  one.
-->
<Panel title={m.values_title()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.values_prose()} /></p>
    {#if report === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if report === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {:else if report.settings.length === 0}
      <p><Said text={m.values_none()} /></p>
    {/if}
  </div>

  {#if report !== undefined}
    {#if report.waiting.length > 0}
      <section class="part" aria-labelledby={heldId}>
        <h3 id={heldId}>{m.waits_title()}</h3>
        <p><Said text={m.waits_heading()} /></p>
        <ul class="lines">
          {#each report.waiting as one (one.service)}
            <li><Said text={waitingWords(one)} /></li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if report.settings.length > 0}
      <ul class="settings" aria-label={m.values_settings()}>
        {#each short.of(report.settings) as setting (setting.name)}
          <Valued
            {setting}
            drafted={draft[setting.name]}
            {valuer}
            cleared={clearing.includes(setting.name)}
            ondraft={(value: string) => {
              unclear(setting.name);
              draft = { ...draft, [setting.name]: value };
            }}
            onclear={() => {
              undraft(setting.name);
              clearing = [...clearing, setting.name];
            }}
          />
        {/each}
      </ul>
      <ShowAll items={report.settings} shortening={short} />
    {/if}

    {#if valuer !== undefined && drafted.length > 0}
      {@const acting = valuer}
      <section class="part" aria-labelledby={draftId}>
        <h3 id={draftId}>{m.values_draft_title()}</h3>
        <ul class="lines">
          {#each drafted as [setting, value] (setting)}
            <li class="drafted">
              <Said text={m.values_draft_line({ setting, value })} />
              <Action
                label={m.action_values_drop({ setting })}
                onclick={() => {
                  undraft(setting);
                }}
              />
            </li>
          {/each}
        </ul>
        <div class="acts">
          <Action
            label={m.action_values_read()}
            weight="firm"
            off={acting.busy}
            onclick={() => {
              acting.onask({ doing: "settings-set", values: { ...draft } });
              draft = {};
            }}
          />
        </div>
      </section>
    {/if}

    {#if valuer !== undefined && clearing.length > 0}
      {@const acting = valuer}
      <section class="part" aria-labelledby={clearingId}>
        <h3 id={clearingId}>{m.values_clearing_title()}</h3>
        <ul class="lines">
          {#each clearing as setting (setting)}
            <li class="drafted">
              <Said text={m.values_clearing_line({ setting })} />
              <Action
                label={m.action_values_drop({ setting })}
                onclick={() => {
                  unclear(setting);
                }}
              />
            </li>
          {/each}
        </ul>
        <div class="acts">
          <Action
            label={m.action_values_read_clear()}
            weight="firm"
            off={acting.busy}
            onclick={() => {
              acting.onask({
                doing: "settings-clear",
                settings: [...clearing],
              });
              clearing = [];
            }}
          />
        </div>
      </section>
    {/if}

    <section class="part" aria-labelledby={secretsId}>
      <h3 id={secretsId}>{m.values_secrets_title()}</h3>
      <p><Said text={m.values_secrets_prose()} /></p>
      {#if report.secrets.length === 0}
        <p><Said text={m.values_secrets_none()} /></p>
      {:else}
        <ul class="secrets">
          {#each report.secrets as secret (secret.name)}
            <li>
              <h4>{secret.name}</h4>
              <ul class="lines">
                <li><Said text={whoseWords(secret.whose)} /></li>
                <li><Said text={secretWords(secret)} /></li>
                {#each secret.readers as reader, at (at)}
                  <li><Said text={readerWords(reader)} /></li>
                {/each}
              </ul>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
  {#if valuer !== undefined}
    <Valuing {valuer} />
  {/if}
</Panel>

<style>
  .scope {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--panel-pad) var(--sp-3);
  }

  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .settings,
  .secrets {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .secrets {
    gap: var(--sp-3);
  }

  .part {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3,
  h4 {
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
  }

  .drafted {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
