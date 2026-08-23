<script lang="ts">
  import StateMark from "./StateMark.svelte";
  import Tag from "./Tag.svelte";
  import { type State, toneFor, wordFor } from "../lib/state";

  interface Props {
    /** How much the figure or the thing behind this tag can be trusted. */
    state: State;
    /** Overrides the state's own word, for a tag naming a thing rather than a state. */
    label?: string | undefined;
  }

  let { state, label }: Props = $props();

  const tone = $derived(toneFor(state));
  const text: string = $derived(label ?? wordFor(state));
</script>

<!--
  A tag that carries a state: the mark's shape says which state, and the tag's
  ground says whether it wants you. The shape is the tag's, so the ground, the
  border and the words are one ruleset rather than two that drift apart.
-->
<Tag {tone} {state} label={text}>
  <StateMark {state} {label} />
</Tag>
