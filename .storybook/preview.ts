import type { Preview } from "@storybook/svelte-vite";
import "../src/app.css";

const preview: Preview = {
  parameters: {
    // Accessibility is a requirement here (G3), so a violation fails the story
    // rather than being reported beside it.
    a11y: { test: "error" },
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      description: "Paper or ink",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "paper", title: "Paper" },
          { value: "ink", title: "Ink" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "paper" },
  decorators: [
    (story, context) => {
      document.documentElement.setAttribute(
        "data-lf-theme",
        String(context.globals["theme"]),
      );
      return story();
    },
  ],
};

export default preview;
