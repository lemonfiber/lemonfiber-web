<script lang="ts">
  import Switch from "./Switch.svelte";
  import Tag from "./Tag.svelte";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What the form is called, in the stack's own words. */
    name: string;
    /** What it is for, in one line, in the stack's own words. */
    description: string;
    /** Whether it can be started alongside another form. */
    composable: boolean;
    /** Whether the operator has taken it up. */
    chosen: boolean;
    /** What taking it up or putting it down asks for. */
    onchoose?: (() => void) | undefined;
  }

  let { name, description, composable, chosen, onchoose }: Props = $props();

  const alongside = $derived(composable ? m.form_alongside() : m.form_alone());
</script>

<!--
  One form the stack declares, and whether the controls below act on it.

  The words are the manifest's own. Forms come from the stack, so a stack of
  somebody's own names and describes them however it likes, and a row that
  paraphrased would be describing a different stack from the one being run.

  Whether a form can run alongside another is a tag rather than a sentence: an
  operator choosing between two forms is exactly who needs to know they are a
  choice, and it has to be legible at a glance down a column of them.

  The control is named after the form it takes up. A reader listing the controls
  on a screen is given the names and nothing around them, and five of one name
  is five controls they cannot tell apart.

  The heading is an h3 — a row sits inside a panel, whose title is the h2.
-->
<div class="formrow">
  <div class="words">
    <h3>{name}</h3>
    <p>{description}</p>
  </div>
  <div class="aside">
    <Tag label={alongside} />
    <Switch on={chosen} label={m.forms_choose({ name })} onclick={onchoose} />
  </div>
</div>

<style>
  .formrow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-4);
    align-items: center;
    padding: var(--sp-4) var(--panel-pad);
    border-bottom: 1px solid var(--line);
  }

  .formrow:last-child {
    border-bottom: 0;
  }

  h3 {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-item);
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 64ch;
  }

  .aside {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
  }

  /* Narrow enough that the tag and the control beside the words leave them
     unreadable, so the two drop below instead. */
  @media (max-width: 40rem) {
    .formrow {
      grid-template-columns: minmax(0, 1fr);
    }

    .aside {
      justify-content: space-between;
    }
  }
</style>
