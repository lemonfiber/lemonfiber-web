import type { Meta, StoryObj } from "@storybook/svelte-vite";
import ShowAll from "./ShowAll.svelte";
import { SHORT, Shortening } from "../lib/shortening.svelte";

/** A list longer than is shown before the rest is asked for. */
const long = Array.from({ length: SHORT * 4 }, (_, at) => at);

const meta = {
  title: "Foundations/ShowAll",
  component: ShowAll,
  args: { items: long, shortening: new Shortening() },
} satisfies Meta<typeof ShowAll>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A long list shortened to its first few, saying how many there are. */
export const Shortened: Story = {};
