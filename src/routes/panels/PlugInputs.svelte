<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Field from "../../components/Field.svelte";
  import type { RecipeInput } from "../../lib/proving";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Every value the reading's recipes ask the operator for. */
    inputs: readonly RecipeInput[];
    /** What has been typed for each, by its name. */
    given: Readonly<Record<string, string>>;
    /** Type a value for one input. */
    ongive: (name: string, value: string) => void;
  }

  let { inputs, given, ongive }: Props = $props();
</script>

<!--
  Every value a reading's recipes ask the operator for, each asked by its own
  question before the yes. One that may be a secret is typed hidden and kept
  by nothing that remembers what is typed.
-->
<div class="part">
  <h4>{m.plug_section_inputs()}</h4>
  <p class="prose"><Said text={m.plug_inputs_prose()} /></p>
  {#each inputs as input (input.name)}
    <Field
      label={input.ask}
      value={given[input.name] ?? ""}
      purpose={input.secret ? "key" : undefined}
      oninput={(value: string) => {
        ongive(input.name, value);
      }}
    />
  {/each}
</div>

<style>
  .part {
    display: grid;
    gap: var(--sp-2);
  }

  h4 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }
</style>
