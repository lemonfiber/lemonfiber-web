<script lang="ts">
  import Board from "./Board.svelte";
  import Banner from "../components/Banner.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import type { Answer } from "../api/member";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What lemonfiber answered the read this address is drawn from. */
    answer: Answer<string> | undefined;
  }

  let { answer }: Props = $props();
</script>

<!--
  A household member at an address that is not one of theirs.

  The page does not decide that it is not theirs. It asks lemonfiber the read
  the address is drawn from, as the console would, and says what came back: a
  refusal in the words lemonfiber refused in, rather than an empty page that
  reads as one with nothing on it. Whatever else came back is not drawn here,
  since nothing the console draws belongs on a member's screen.
-->
<Board>
  {#if answer === undefined}
    <Skeleton width="16rem" label={m.waiting_answer()} />
  {:else if answer.at === "refused" || answer.at === "declined"}
    <Banner
      tone="watch"
      lead={m.member_away_lead()}
      prose={answer.said ?? m.member_away_unsaid()}
    />
  {:else if answer.at === "unanswered"}
    <Banner
      tone="watch"
      lead={m.member_unanswered_lead()}
      prose={m.member_unanswered()}
    />
  {:else}
    <Banner
      tone="calm"
      lead={m.member_away_nothing_lead()}
      prose={m.member_away_nothing()}
    />
  {/if}
</Board>
