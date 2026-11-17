<script lang="ts">
  import onPaper from "@lemonfiber/brand/logo/lockup-horizontal.svg?url";
  import onInk from "@lemonfiber/brand/logo/lockup-horizontal-on-ink.svg?url";
  import * as m from "../paraglide/messages.js";
</script>

<!--
  The brand's lockup, drawn for the paper or the ink theme. Only the operator's
  console carries it: a member's chrome names the house instead.
-->
<img class="on-paper" src={onPaper} alt={m.product_name()} height="32" />
<img class="on-ink" src={onInk} alt={m.product_name()} height="32" />

<style>
  img {
    width: auto;
    image-rendering: pixelated;
  }

  .on-ink,
  :global([data-lf-theme="ink"]) .on-paper {
    display: none;
  }

  :global([data-lf-theme="ink"]) .on-ink {
    display: block;
  }

  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-lf-theme="paper"])) .on-paper {
      display: none;
    }

    :global(:root:not([data-lf-theme="paper"])) .on-ink {
      display: block;
    }
  }
</style>
