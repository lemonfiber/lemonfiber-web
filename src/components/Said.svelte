<script lang="ts">
  import Term from "./Term.svelte";
  import { explainedHere } from "../lib/explained.svelte";
  import { piecesOf } from "../lib/terms";

  interface Props {
    /** The line, in the console's words or lemonfiber's. */
    text: string;
  }

  let { text }: Props = $props();

  const explained = explainedHere();

  /** The line cut at its code, and at its terms while explaining is on. */
  const pieces = $derived(
    piecesOf(text, explained?.on === true ? explained.finder : undefined),
  );
</script>

<!--
  One line of text, with every domain term in it explained where it stands.

  The line reads exactly as written, except that a command or a name set
  between backticks is shown as code rather than with its backticks. Where the
  reader has turned explaining off, or there is no glossary to explain from,
  nothing else is marked; otherwise each term in it can be pressed for what it
  means.
-->
{#each pieces as piece, at (at)}{#if piece.code === true}<code class="lit"
      >{piece.text}</code
    >{:else if piece.word === undefined || explained === undefined}{piece.text}{:else}<Term
      term={piece.text}
      word={piece.word}
      explain={explained.explain}
    />{/if}{/each}

<style>
  .lit {
    padding: 0 var(--sp-hair);
    border-radius: var(--r-sm);
    background: var(--pith);
    font-family: var(--mono);
    font-size: 0.92em;
    overflow-wrap: anywhere;
  }
</style>
