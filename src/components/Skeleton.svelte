<script lang="ts">
  interface Props {
    /**
     * How wide the bar stands at most: the width of the text it holds a place
     * for. A column narrower than that gets a narrower bar rather than a page
     * that scrolls sideways.
     */
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
<div class="skel" aria-hidden="true" style:max-width={width}></div>
{#if label !== undefined}
  <span class="said" role="status">{label}</span>
{/if}

<style>
  /* The width given is a ceiling rather than a measure. It is the width of the
     line being held a place for, and a narrow column is narrower than some of
     those lines — a place held wider than the space holding it takes the page
     sideways, and asks the column it sits in to be that wide. */
  .skel {
    width: 100%;
    background: var(--canvas);
    border-radius: var(--r-sm);
    height: 0.6875rem;
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
</style>
