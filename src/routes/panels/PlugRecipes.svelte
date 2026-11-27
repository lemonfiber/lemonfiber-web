<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Switch from "../../components/Switch.svelte";
  import { pairLines, recipeLines } from "../../lib/plugged";
  import type { PluginRecipe } from "../../lib/proving";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The recipes a reading would run. */
    recipes: readonly PluginRecipe[];
    /** Every value approved so far, as its reading writes the approval. */
    approved: readonly string[];
    /** Approve one value, or take the approval back. */
    onflip: (approval: string) => void;
  }

  let { recipes, approved, onflip }: Props = $props();
</script>

<!--
  Every recipe a reading would run, with each call it makes and each value it
  could carry, a value that would leave the machine or the service it was
  read from approved on a switch of its own, off until turned on.
-->
<div class="part">
  <h4>{m.plug_section_recipes()}</h4>
  {#each recipes as recipe (recipe.id)}
    <div class="recipe">
      <h5>{recipe.title}</h5>
      <ul class="lines">
        {#each recipeLines(recipe) as line, at (at)}
          <li><Said text={line} /></li>
        {/each}
      </ul>
      <ul class="pairs">
        {#each recipe.pairs as pair, at (at)}
          <li>
            <ul class="lines">
              {#each pairLines(pair) as line, place (place)}
                <li><Said text={line} /></li>
              {/each}
            </ul>
            {#if pair.approval !== undefined}
              {@const approval = pair.approval}
              <Switch
                on={approved.includes(approval)}
                label={m.plug_approve({ approval })}
                onclick={() => {
                  onflip(approval);
                }}
              />
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <p class="prose"><Said text={m.plug_recipes_none()} /></p>
  {/each}
</div>

<style>
  h4,
  h5 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  h5 {
    font-weight: 500;
  }

  .part,
  .recipe {
    display: grid;
    gap: var(--sp-2);
  }

  .lines,
  .pairs {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .pairs > li {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-3);
    align-items: start;
    justify-content: space-between;
  }

  .lines li,
  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }
</style>
