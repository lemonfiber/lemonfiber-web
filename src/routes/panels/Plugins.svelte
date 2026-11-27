<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import {
    installedLines,
    nameOf,
    substitutedLine,
    type Plugins,
  } from "../../lib/plugins";
  import type { Plugger } from "../../lib/plugging";
  import { demandRecipes } from "../../lib/proving";
  import Plugging from "./Plugging.svelte";
  import PlugCatalogue from "./PlugCatalogue.svelte";
  import type { PluginCatalogue } from "../../lib/catalogued";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The plugins on this machine, or why they could not be read. */
    plugins: Reading<Plugins> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
    /** What the plugin catalogue offers, or why it could not be read. */
    offering?: Reading<PluginCatalogue> | undefined;
    /** What acting on a plugin asks for, where this page may act. */
    plugger?: Plugger | undefined;
  }

  let { plugins, freshness, offering, plugger }: Props = $props();

  const substitutedId = $props.id();

  const held = $derived(plugins?.ok === true ? plugins.value : undefined);
  const problem = $derived(
    plugins?.ok === false ? plugins.problem.message : undefined,
  );
  const sources = $derived(held?.sources ?? []);
  const substituted = $derived(held?.substituted ?? []);
</script>

<!--
  Every plugin on this machine: each under its name, with what it does, the
  version installed, where it came from, what it runs and fills, and whether
  its source still answers where that was asked; and every capability a
  plugin's service fills in place of the stack's own; and what the plugin
  catalogue offers. Where acting is given, each plugin can be updated,
  removed, proved again or have a recipe it runs by name run, and another
  installed, from a source typed or from the catalogue, each read first and
  agreed to under the name its reading gave itself.
-->
<Panel title={m.panel_plugins()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.plugin_prose()} /></p>
    {#if held === undefined && problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else if held === undefined}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {:else if held.installed.length === 0}
      <p><Said text={m.plugin_none()} /></p>
    {/if}
  </div>

  {#if held !== undefined && held.installed.length > 0}
    <ul class="entries" aria-label={m.plugin_said()}>
      {#each held.installed as plugin (plugin.plugin)}
        <li>
          <h3>{nameOf(plugin)}</h3>
          <ul class="lines">
            {#each installedLines(plugin, sources) as line, at (at)}
              <li><Said text={line} /></li>
            {/each}
          </ul>
          {#if plugger !== undefined}
            {@const acting = plugger}
            {@const named = demandRecipes(plugin.recipes)}
            <div class="acts">
              <Action
                label={m.action_plug_update({ name: nameOf(plugin) })}
                off={acting.busy}
                onclick={() => {
                  acting.onask({
                    doing: "plugin-update",
                    plugin: plugin.plugin,
                    source: plugin.from ?? "",
                  });
                }}
              />
              <Action
                label={m.action_plug_remove({ name: nameOf(plugin) })}
                off={acting.busy}
                onclick={() => {
                  acting.onask({
                    doing: "plugin-remove",
                    plugin: plugin.plugin,
                  });
                }}
              />
              <Action
                label={m.action_plug_prove({ name: nameOf(plugin) })}
                off={acting.busy}
                onclick={() => {
                  acting.onask({
                    doing: "plugin-prove",
                    plugin: plugin.plugin,
                  });
                }}
              />
            </div>
            {#if named.length > 0}
              <div class="run">
                <h4>{m.plug_run_title()}</h4>
                <p><Said text={m.plug_run_prose()} /></p>
                <ul class="lines">
                  {#each named as recipe (recipe.id)}
                    <li>
                      <Action
                        label={m.action_plug_run({ recipe: recipe.title })}
                        off={acting.busy}
                        onclick={() => {
                          acting.onask({
                            doing: "plugin-run",
                            plugin: plugin.plugin,
                            recipe: recipe.id,
                          });
                        }}
                      />
                      <Said text={recipe.why} />
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if substituted.length > 0}
    <section class="substituted" aria-labelledby={substitutedId}>
      <h3 id={substitutedId}>{m.plugin_substituted_said()}</h3>
      <ul class="lines">
        {#each substituted as one, at (at)}
          <li><Said text={substitutedLine(one)} /></li>
        {/each}
      </ul>
    </section>
  {/if}
  {#if offering !== undefined}
    <PlugCatalogue {offering} {plugger} />
  {/if}
  {#if plugger !== undefined}
    <Plugging {plugger} />
  {/if}
</Panel>

<style>
  .scope {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--panel-pad) var(--sp-3);
  }

  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .entries {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entries > li,
  .substituted {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  .lines {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .lines li {
    font-size: var(--text-prose);
    color: var(--muted);
  }

  .run {
    display: grid;
    gap: var(--sp-2);
  }

  h4 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 500;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin-top: var(--sp-2);
  }
</style>
