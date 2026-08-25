<script lang="ts">
  import Icon from "./Icon.svelte";
  import type { IconName } from "../lib/icons";

  interface Props {
    /** The screen it goes to. */
    href: string;
    /** The drawing that stands for that screen. */
    icon: IconName;
    /** What the screen is called. */
    label: string;
    /** How many things are waiting there, as it should read. Left out where nothing counts them. */
    tally?: string | undefined;
    /** Whether what the tally counts wants the operator now. */
    urgent?: boolean | undefined;
    /** Whether this is the screen being read. */
    current?: boolean | undefined;
    /**
     * What pressing it asks for. Given where the page answers its own addresses,
     * so the link stays a link and the router is handed the click rather than an
     * ancestor listening for it.
     */
    onclick?: ((event: MouseEvent) => void) | undefined;
  }

  let {
    href,
    icon,
    label,
    tally,
    urgent = false,
    current = false,
    onclick,
  }: Props = $props();
</script>

<!--
  One screen in the menu: its drawing, its name, and how many things are
  waiting on it.

  A link, not a button. Each of these goes to an address of its own, so it is
  announced as a link, reached from the links a screen reader lists, opened in
  a second tab, copied, and left behind by the back button — none of which a
  button standing in for one can do. `aria-current="page"` says which of the
  addresses is the one being read, which is a claim only a set of links can
  make.

  The drawing is decorative: the name beside it says the same thing, and
  announcing both says it twice.
-->
<a class="mitem" {href} {onclick} aria-current={current ? "page" : undefined}>
  <Icon name={icon} />
  <span class="word">{label}</span>
  {#if tally !== undefined}
    <span class="tally" class:hot={urgent}>{tally}</span>
  {/if}
</a>

<style>
  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  .mitem {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    height: var(--row-h);
    padding: 0 var(--sp-3);
    border-radius: var(--r-md);
    color: var(--muted);
    font-size: var(--text-panel);
    text-align: left;
    text-decoration: none;
  }

  .mitem:hover {
    background: var(--pith);
    color: var(--text);
  }

  /* The screen being read is the only row given a ground, so a menu of eleven
     has one thing in it with weight. */
  .mitem[aria-current="page"] {
    background: var(--paper);
    color: var(--text);
    font-weight: 600;
    box-shadow: inset 0 0 0 1px var(--line);
  }

  .mitem :global(.ic) {
    color: var(--faint);
  }

  .mitem[aria-current="page"] :global(.ic) {
    color: var(--fiber-deep);
  }

  /* A figure, so it is set in the face every figure on this surface is set in
     and lines up down the column with the ones above and below it. */
  .tally {
    margin-left: auto;
    padding: 0 var(--sp-tight);
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    background: var(--pith);
    color: var(--muted);
    font-family: var(--mono);
    font-size: var(--text-tag);
  }

  .hot {
    border-color: var(--alarm);
    background: var(--alarm-tint);
    color: var(--alarm);
  }
</style>
