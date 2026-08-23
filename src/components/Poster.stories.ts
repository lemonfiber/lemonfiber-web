import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Poster from "./Poster.svelte";
import { everyState } from "../lib/state";
import * as m from "../paraglide/messages.js";

// A picture of the title and nothing more, small enough to sit in this file.
const artwork =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAEElEQVR42mN4UCUORAwoFABfmginlyLNOQAAAABJRU5ErkJggg==";

const meta = {
  title: "Surfaces/Poster",
  component: Poster,
  argTypes: { state: { control: "select", options: everyState } },
} satisfies Meta<typeof Poster>;

export default meta;
type Story = StoryObj<typeof meta>;

// The titles below are the only literals here: what a household asked for is
// data, not a word this interface chose.

/** On the telly already. Nothing to do, which the tag says in those words. */
export const ReadyToWatch: Story = {
  args: {
    title: "Dune: Part Two",
    state: "known",
    label: m.poster_ready_to_watch(),
  },
};

/** Under way, and nobody has to do anything about it. */
export const OnItsWay: Story = {
  args: {
    title: "The Bear",
    state: "part",
    label: m.poster_getting_it_now(),
  },
};

/**
 * Asked for, and waiting on a person. Nothing is wrong, so the tag stays as
 * quiet as the one on a thing that is already here.
 */
export const WaitingToBeApproved: Story = {
  args: {
    title: "Poor Things",
    state: "unknown",
    label: m.poster_waiting_yes(),
  },
};

/**
 * Not a thing yet, so the frame is not closed. It ends the wall by offering
 * the one thing the wall is for, and takes a caption where the others take a
 * tag.
 */
export const AskForSomething: Story = {
  args: {
    title: m.poster_ask(),
    note: m.poster_search(),
    outline: true,
  },
};

/**
 * The same poster once the artwork has been fetched. The picture replaces the
 * lettering standing in for it and nothing else moves — the name stays text
 * under the frame, which is what a screen reader is given either way.
 */
export const WithArtwork: Story = {
  args: {
    title: "Dune: Part Two",
    artwork,
    state: "known",
    label: m.poster_ready_to_watch(),
  },
};
