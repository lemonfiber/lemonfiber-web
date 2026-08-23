import type { StorybookConfig } from "@storybook/svelte-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|svelte)"],
  addons: ["@storybook/addon-a11y"],
  framework: { name: "@storybook/svelte-vite", options: {} },
  // G8: nothing about this project leaves the machine it runs on, and a build
  // tool is not an exception.
  core: { disableTelemetry: true },
};

export default config;
