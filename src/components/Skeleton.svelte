<script lang="ts">
  interface Props {
    /** How wide the bar stands: the width of the text it holds a place for. */
    width: string;
    /**
     * What has not arrived. Given to one bar in a run, so a row of them is
     * announced once rather than once each.
     */
    label?: string | undefined;
  }

  let { width, label }: Props = $props();
</script>

<!--
  The shape of a line that has not arrived. It is a place being held, not
  content, so it is hidden from a screen reader: a reader told "graphic" three
  times has been told nothing three times. The words that say what is coming
  are given once, as a status, and are read in the place the bars occupy.

  The pulse is opt-in, under `prefers-reduced-motion: no-preference`. It fades
  and returns over a second and a half, which is a surface breathing rather
  than a surface blinking.
-->
<div class="skel" aria-hidden="true" style:width></div>
{#if label !== undefined}
  <span class="said" role="status">{label}</span>
{/if}

<style>
  .skel {
    background: var(--canvas);
    border-radius: var(--r-sm);
    height: 11px;
  }

  @media (prefers-reduced-motion: no-preference) {
    .skel {
      animation: shim 1.5s ease-in-out infinite;
    }

    @keyframes shim {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.45;
      }
    }
  }

  /* Read, never seen: the bars beside it are what a sighted reader gets. */
  .said {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
