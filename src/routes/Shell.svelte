<script lang="ts" generics="P extends string">
  import type { Snippet } from "svelte";
  import MenuItem from "../components/MenuItem.svelte";
  import * as m from "../paraglide/messages.js";
  import type { Menu } from "../lib/route";

  interface Props {
    /**
     * The place being read, where it is one the menu leads to. An address that
     * is none of them marks none.
     */
    place: P | undefined;
    /** Where the menu leads, which follows from who signed in. */
    menu: Menu<P>;
    /** What pressing a place asks for. Left out where nothing answers it. */
    ongo?: ((place: P, event: MouseEvent) => void) | undefined;
    /** The screen the menu leads to. */
    children: Snippet;
  }

  let { place, menu, ongo, children }: Props = $props();

  /**
   * Bring the place being read into view in a menu that scrolls sideways, so
   * a phone opened on the last screen still shows which one it is.
   */
  function inView(item: HTMLElement): void {
    item.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
</script>

<!--
  The chrome every screen sits in: the wordmark, the menu, and the screen. The
  console and a household member are handed different menus, and the chrome is
  the same for both.

  The menu is a list of links to addresses, so a screen can be typed in, opened
  in a second tab and left behind by the back button. The page answers the plain
  ones itself and leaves the rest to the browser, which is the whole reason they
  are links.
-->
<div class="console">
  <header class="brow">
    <p class="mark">{m.product_name()}</p>
  </header>

  <nav class="menu" aria-label={menu.named()}>
    <ul>
      {#each menu.places as one (one)}
        <li {@attach one === place ? inView : undefined}>
          <MenuItem
            href={menu.pathOf(one)}
            icon={menu.iconOf(one)}
            label={menu.nameOf(one)}
            current={one === place}
            onclick={(event: MouseEvent) => {
              ongo?.(one, event);
            }}
          />
        </li>
      {/each}
    </ul>
  </nav>

  <main>
    {@render children()}
  </main>
</div>

<style>
  .console {
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(0, 13rem) minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-areas:
      "brow brow"
      "menu main";
    background: var(--canvas);
  }

  .brow {
    grid-area: brow;
    display: flex;
    align-items: center;
    padding: var(--sp-3) var(--sp-5);
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }

  .mark {
    margin: 0;
    font-family: var(--brandface);
    font-weight: 800;
    font-size: var(--text-item);
    letter-spacing: -0.045em;
  }

  .menu {
    grid-area: menu;
    padding: var(--sp-3);
    border-right: 1px solid var(--line);
    background: var(--pith);
  }

  ul {
    display: grid;
    gap: var(--sp-hair);
    align-content: start;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    min-width: 0;
  }

  main {
    grid-area: main;
    min-width: 0;
    padding: var(--sp-5);
  }

  /* Narrower than a column beside the screen can be read in, so the menu lies
     across the top of it and scrolls sideways rather than squeezing it. */
  @media (max-width: 52rem) {
    .console {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto auto minmax(0, 1fr);
      grid-template-areas:
        "brow"
        "menu"
        "main";
    }

    .menu {
      border-right: 0;
      border-bottom: 1px solid var(--line);
      overflow-x: auto;
    }

    ul {
      display: flex;
    }

    /* Each place keeps the width its name needs, so the row scrolls rather
       than squeezing the names into their neighbours' drawings. */
    li {
      flex: none;
    }

    .menu :global(.mitem) {
      white-space: nowrap;
    }

    main {
      padding: var(--sp-4) var(--sp-3);
    }
  }
</style>
