import type { Meta, StoryObj } from "@storybook/svelte-vite";
import BigFigure from "./BigFigure.svelte";
import { everyState } from "../lib/state";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Surfaces/BigFigure",
  component: BigFigure,
  argTypes: { state: { control: "select", options: everyState } },
} satisfies Meta<typeof BigFigure>;

export default meta;
type Story = StoryObj<typeof meta>;

// The figures below are the only literals here: a figure is data the API
// already formatted, not a word the interface chose.

/**
 * How much room is left, and what that is out of. The two sit on one baseline
 * so the figure is read as a share of something rather than on its own.
 */
export const FreeSpace: Story = {
  args: {
    state: "known",
    eyebrow: m.eyebrow_free_space(),
    figure: "412 GB",
    beside: m.figure_free_of({ total: "4 TB" }),
  },
};

/**
 * How many of them are working. The whole carries less ink than the part: the
 * answer to "how many" is the 9, and the 11 is what makes it mean something.
 */
export const HowManyAreWorking: Story = {
  args: {
    state: "known",
    figure: "9",
    outOf: "/11",
    beside: m.figure_working(),
  },
};

/**
 * A rate. The unit rides inside the figure at half its size, so a wall of
 * these lines up on the number rather than on whatever unit each one is in.
 */
export const ComingInNow: Story = {
  args: {
    state: "known",
    eyebrow: m.eyebrow_coming_in(),
    figure: "4.1",
    unit: "MB/s",
    caption: m.figure_one_running(),
  },
};

/**
 * The count that wants somebody. One figure on a screen is set in the ink of
 * a thing that is wrong; the caption under it says what happened.
 */
export const Stuck: Story = {
  args: {
    state: "known",
    eyebrow: m.eyebrow_stuck(),
    figure: "1",
    caption: m.figure_gave_up(),
    alarm: true,
  },
};

/**
 * Nothing has measured it. `Value` inside sets it in words rather than as a
 * numeral, at the size the figure would have been — a large "not known" is
 * still not a measurement, and must not be able to look like one.
 */
export const NeverMeasured: Story = {
  args: {
    state: "unknown",
    eyebrow: m.eyebrow_coming_in(),
    unit: "MB/s",
    caption: m.figure_one_running(),
  },
};
