<script lang="ts">
  import StateTag from "./components/StateTag.svelte";
  import { type State } from "./lib/state";
  import * as m from "./paraglide/messages.js";

  const every: State[] = ["known", "quiet", "unknown", "stopped", "part"];
</script>

<main>
  <h1>{m.product_name()}</h1>
  <p>{m.home_unfinished()}</p>
  <ul>
    {#each every as state (state)}
      <li><StateTag {state} /></li>
    {/each}
  </ul>
</main>

<style>
  main {
    max-width: 46rem;
    margin: 0 auto;
    padding: var(--sp-6) var(--sp-5);
  }

  h1 {
    font-family: var(--brandface);
    font-weight: 800;
    letter-spacing: -0.045em;
    margin: 0 0 var(--sp-3);
  }

  p {
    color: var(--muted);
    margin: 0 0 var(--sp-5);
    max-width: 62ch;
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>
