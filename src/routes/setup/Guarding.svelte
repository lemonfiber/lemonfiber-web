<script lang="ts">
  import Field from "../../components/Field.svelte";
  import Said from "../../components/Said.svelte";
  import Segmented from "../../components/Segmented.svelte";
  import {
    askedNow,
    chosen,
    offered,
    type Given,
    type GuardQuestion,
  } from "../../lib/guarding";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the tunnel step asks of the egress guard, in order. */
    questions: readonly GuardQuestion[];
    /** Each setting given so far, by name. */
    settings: Given;
    /** Each secret given so far, by name, held until the answer is sent. */
    secrets: Given;
    /** What giving a setting asks for. */
    onsetting: (setting: string, value: string) => void;
    /** What giving a secret asks for. */
    onsecret: (secret: string, value: string) => void;
  }

  let { questions, settings, secrets, onsetting, onsecret }: Props = $props();

  const asked = $derived(askedNow(questions, settings));
</script>

<!--
  What the tunnel service needs, asked in the order setup gives it: each
  setting with values offered only where the answers before it allow them, a
  setting only the operator holds typed, and a secret typed into a box that
  hides it. A question whose needs the answers leave unmet is not drawn, and
  its answer is not sent.
-->
<div class="guarding">
  <p class="prose"><Said text={m.wizard_guard_prose()} /></p>
  {#each asked as question (question.asks === "secret" ? question.secret : question.setting)}
    {#if question.asks === "choice"}
      <Segmented
        label={m.wizard_guard_choose({ setting: question.setting })}
        options={offered(questions, settings, question).map((value) => ({
          value,
          label: value,
        }))}
        selected={chosen(questions, settings, question) ?? ""}
        onselect={(value: string) => {
          onsetting(question.setting, value);
        }}
      />
    {:else if question.asks === "value"}
      <Field
        label={m.wizard_guard_value({ setting: question.setting })}
        value={settings[question.setting] ?? ""}
        oninput={(value: string) => {
          onsetting(question.setting, value);
        }}
      />
    {:else}
      <Field
        label={m.wizard_guard_secret({ secret: question.secret })}
        value={secrets[question.secret] ?? ""}
        hint={question.why}
        purpose="secret"
        oninput={(value: string) => {
          onsecret(question.secret, value);
        }}
      />
    {/if}
  {/each}
</div>

<style>
  .guarding {
    display: grid;
    gap: var(--sp-3);
    justify-items: start;
  }

  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 64ch;
  }
</style>
