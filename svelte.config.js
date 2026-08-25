import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { raisedAt, refuses, refusal } from "./scripts/warned.mjs";

export default {
  preprocess: vitePreprocess(),

  /**
   * An accessibility warning stops the compile rather than being printed
   * beside it. Every pipeline that builds a component through
   * `vite-plugin-svelte` reads this hook, so a control only a pointer can
   * reach fails the build it appears in.
   */
  onwarn(warning, handle) {
    if (refuses(warning)) {
      throw new Error(`${raisedAt(warning)}  ${refusal(warning)}`);
    }
    handle(warning);
  },
};
