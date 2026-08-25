import type { Meta, StoryObj } from "@storybook/svelte-vite";
import FormRow from "./FormRow.svelte";

const meta = {
  title: "Surfaces/FormRow",
  component: FormRow,
  args: {
    name: "Media",
    description: "Your library, and what serves it to the household.",
    composable: true,
    chosen: false,
  },
} satisfies Meta<typeof FormRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A form that has not been taken up. The tag says it is a choice rather than
 * the only one, which is what an operator weighing two forms needs first.
 */
export const NotChosen: Story = {};

/**
 * Taken up, so the controls below the listing act on it. The knob's travel
 * says so, and the control announces it in the one place a screen reader
 * looks.
 */
export const Chosen: Story = { args: { chosen: true } };

/**
 * A form that cannot share the machine with another. Said in the listing
 * rather than only when a combination is refused.
 */
export const RunsOnItsOwn: Story = {
  args: {
    name: "Core",
    description: "The tunnel, the download programs, and what finds things.",
    composable: false,
  },
};

/**
 * A stack whose own words run long. The description keeps its measure and the
 * control keeps its place beside it.
 */
export const ALongDescription: Story = {
  args: {
    name: "Everything",
    description:
      "Every program this stack declares, started together: the tunnel, both download clients, what finds things, what files them, what serves them, and the pages the household asks through.",
  },
};
