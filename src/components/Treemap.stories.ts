import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Treemap from "./Treemap.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Surfaces/Treemap",
  component: Treemap,
  argTypes: {
    blocks: { control: "object" },
    label: { control: "text" },
  },
  args: { label: m.panel_where_space_went() },
} satisfies Meta<typeof Treemap>;

export default meta;
type Story = StoryObj<typeof meta>;

// The amounts below are the only literals here: a size is data the API
// already formatted, not a word the interface chose.

/**
 * A full disk, where it went. The palette ramps by size — lemon, then fiber,
 * then the panel's own ground — and the space nothing is using takes the
 * page's ground, which is what emptiness looks like everywhere else here.
 */
export const WhereYourSpaceWent: Story = {
  args: {
    blocks: [
      {
        name: m.space_films(),
        value: "2.1 TB · 58%",
        share: 0.58,
        ground: "biggest",
      },
      { name: m.space_series(), value: "960 GB", share: 0.24, ground: "next" },
      {
        name: m.space_downloads(),
        value: "548 GB",
        share: 0.13,
        ground: "other",
      },
      { name: m.space_free(), value: "412 GB", share: 0.1, ground: "free" },
      { name: m.space_other(), value: "28 GB", share: 0.01, ground: "other" },
    ],
  },
};

/**
 * A disk with room on it. Free space is the biggest block, so it is drawn
 * biggest and read first — and it keeps the ground that says nothing is
 * using it, since how much of something there is and what it is are two
 * different facts.
 */
export const RoomToSpare: Story = {
  args: {
    blocks: [
      { name: m.space_free(), value: "2.6 TB", share: 0.65, ground: "free" },
      {
        name: m.space_films(),
        value: "820 GB",
        share: 0.2,
        ground: "biggest",
      },
      { name: m.space_series(), value: "600 GB", share: 0.15, ground: "next" },
    ],
  },
};
