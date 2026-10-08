<script lang="ts">
  import Term from "./Term.svelte";
  import type { Explaining } from "../lib/wire";
  import { explainedHere } from "../lib/explained.svelte";
  import { piecesOf, type Piece } from "../lib/terms";

  interface Props {
    /** The line, in the console's words or lemonfiber's. */
    text: string;
  }

  let { text }: Props = $props();

  const explained = explainedHere();

  /** The line cut at its terms, and how a term is explained, while explaining is on. */
  const marked = $derived.by(
    ():
      | { readonly pieces: readonly Piece[]; readonly explain: Explaining }
      | undefined => {
      const finder = explained?.finder;
      if (explained?.on !== true || finder === undefined) return undefined;
      return { pieces: piecesOf(text, finder), explain: explained.explain };
    },
  );
</script>

<!--
  One line of text, with every domain term in it explained where it stands.

  The line reads exactly as written. Where the reader has turned explaining
  off, or there is no glossary to explain from, it is the text and nothing
  else; otherwise each term in it can be pressed for what it means.
-->
{#if marked === undefined}{text}{:else}{#each marked.pieces as piece, at (at)}{#if piece.word === undefined}{piece.text}{:else}<Term
        term={piece.text}
        word={piece.word}
        explain={marked.explain}
      />{/if}{/each}{/if}
