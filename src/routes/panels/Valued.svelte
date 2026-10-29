<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Segmented from "../../components/Segmented.svelte";
  import {
    aboutLines,
    valueWords,
    whoseWords,
    type ValueRead,
  } from "../../lib/values";
  import type { Valuer } from "../../lib/valuing";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The setting drawn. */
    setting: ValueRead;
    /** The value the change being put together gives it, where it gives one. */
    drafted: string | undefined;
    /** What changing it asks for, where this page may act. */
    valuer: Valuer | undefined;
    /** Whether the values being taken away include it. */
    cleared: boolean;
    /** What putting a value into the change asks for. */
    ondraft: (value: string) => void;
    /** What putting it among the values being taken away asks for. */
    onclear: () => void;
  }

  let { setting, drafted, valuer, cleared, ondraft, onclear }: Props = $props();

  /** Whether a value is being typed for it. */
  let editing = $state(false);

  /** The value typed. */
  let typed = $state("");

  const recorded = $derived(setting.value ?? undefined);
  const choices = $derived(setting.choices ?? []);
</script>

<!--
  One setting a service reads from the operator: whose it is, what it holds,
  where it was filed from, the values it accepts and each service that reads
  it. Where acting is given, a value is put into the change being put together,
  chosen from the setting's declared values where it declares them and typed
  where it does not, and a value the operator recorded can be put among those
  taken away, which writes each default again. Every declared value can be chosen, a closed one
  too, because the settings it depends on can move in the same change.
-->
<li class="setting">
  <h3>{setting.name}</h3>
  <p class="note">{whoseWords(setting.whose)}</p>
  <p class="prose"><Said text={valueWords(setting)} /></p>
  <ul class="lines">
    {#each aboutLines(setting) as line, at (at)}
      <li><Said text={line} /></li>
    {/each}
  </ul>
  {#if valuer !== undefined}
    {#if choices.length > 0}
      <Segmented
        label={m.values_choose({ setting: setting.name })}
        options={choices.map((one) => ({ value: one.value, label: one.value }))}
        selected={drafted ?? recorded ?? ""}
        onselect={ondraft}
      />
    {:else if editing}
      <Field
        label={m.values_choose({ setting: setting.name })}
        value={typed}
        oninput={(value: string) => {
          typed = value;
        }}
      />
      <div class="acts">
        <Action
          label={m.action_values_add()}
          weight="firm"
          onclick={() => {
            ondraft(typed);
            editing = false;
          }}
        />
        <Action
          label={m.action_leave_as_is()}
          onclick={() => {
            editing = false;
          }}
        />
      </div>
    {/if}
    {@const clearable = recorded !== undefined && !cleared}
    {#if !editing && (choices.length === 0 || clearable)}
      <div class="acts">
        {#if choices.length === 0}
          <Action
            label={m.action_values_edit({ setting: setting.name })}
            onclick={() => {
              typed = drafted ?? recorded ?? "";
              editing = true;
            }}
          />
        {/if}
        {#if clearable}
          <Action
            label={m.action_values_clear({ setting: setting.name })}
            onclick={onclear}
          />
        {/if}
      </div>
    {/if}
  {/if}
</li>

<style>
  .setting {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: var(--text-prose);
    max-width: 76ch;
  }

  .note {
    color: var(--muted);
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

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
