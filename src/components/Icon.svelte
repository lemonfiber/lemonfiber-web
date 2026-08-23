<script lang="ts">
  import { drawings, type IconName, type IconSize } from "../lib/icons";

  interface Props {
    /** Which drawing. */
    name: IconName;
    /** `regular` sits beside a label; `small` sits inside a tag or a row. */
    size?: IconSize | undefined;
    /**
     * Announced to a screen reader. Left out wherever words beside the drawing
     * already say the same thing, which makes it decorative.
     */
    label?: string | undefined;
  }

  let { name, size = "regular", label }: Props = $props();

  const shapes = $derived(drawings[name]);
  const named = $derived(label !== undefined);
</script>

<!--
  One hand for the whole set: a 24 grid, a 1.6 stroke, rectilinear with rounded
  joins. Every drawing is built from the same parts, so a row of them reads as
  one alphabet rather than as several borrowed ones.

  Decorative unless named. Nearly every drawing sits beside words that already
  say what it means, and one announced beside them says it twice; `label` is
  for the drawing that stands on its own.
-->
<svg
  class="ic"
  class:small={size === "small"}
  viewBox="0 0 24 24"
  role={named ? "img" : undefined}
  aria-label={label}
  aria-hidden={named ? undefined : "true"}
>
  {#each shapes as shape (shape)}
    {#if shape.kind === "path"}
      <path d={shape.d} />
    {:else if shape.kind === "rect"}
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        rx={shape.rx}
        transform={shape.transform}
        stroke-dasharray={shape.dash}
      />
    {:else}
      <circle cx={shape.cx} cy={shape.cy} r={shape.r} />
    {/if}
  {/each}
</svg>

<style>
  .ic {
    width: 1.125rem;
    height: 1.125rem;
    flex: none;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Beside smaller words: a tag, a table row, a stamp. */
  .small {
    width: 0.875rem;
    height: 0.875rem;
  }
</style>
