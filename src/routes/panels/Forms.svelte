<script lang="ts">
  import FormRow from "../../components/FormRow.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import type { Forms } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Every form the stack declares, or why they could not be listed. */
    forms: Reading<Forms> | undefined;
    /** The forms the operator chose, by the id the listing gave them. */
    chosen: readonly string[];
    /** What taking a form up or putting it down asks for. */
    onchoose: (form: string) => void;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { forms, chosen, onchoose, freshness }: Props = $props();

  const declared = $derived(forms?.ok === true ? forms.value.forms : undefined);
  const problem = $derived(
    forms?.ok === false ? forms.problem.message : undefined,
  );
  const listed = $derived(declared !== undefined && declared.length > 0);
</script>

<!--
  Every form the stack declares, and which of them the controls below act on.

  Forms come from the stack rather than from lemonfiber, so their names are not
  something this page can hold in advance: nothing here is drawn until the
  listing answers, and a stack that declares none says so rather than showing an
  empty frame.

  Choosing is kept here rather than on the panel that acts. What is chosen
  outlasts any one request — an operator restarts a form and then fetches newer
  images for it — so it belongs beside the forms rather than beside the buttons.
-->
<Panel title={m.panel_forms()} {freshness} flush={listed}>
  {#if declared !== undefined && listed}
    {#each declared as form (form.id)}
      <FormRow
        name={form.name}
        description={form.description}
        composable={form.composable}
        chosen={chosen.includes(form.id)}
        onchoose={() => {
          onchoose(form.id);
        }}
      />
    {/each}
  {:else if declared !== undefined}
    <Value state="unknown" absent={m.forms_none()} />
  {:else if problem !== undefined}
    <Value state="unknown" absent={problem} />
  {:else}
    <Skeleton width="12rem" label={m.waiting_answer()} />
  {/if}
</Panel>
