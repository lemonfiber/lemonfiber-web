import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Tag from "./Tag.svelte";
import { marking } from "../../.storybook/snippets";
import { everyTone, severityWord } from "../lib/state";

const meta = {
  title: "Foundations/Tag",
  component: Tag,
  argTypes: { tone: { control: "select", options: everyTone } },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A plain label, and a third of the tags on the screen. It names how something
 * arrived, what it is or who it belongs to — no severity, so no ground.
 */
export const NamingAThing: Story = { args: { label: "torrent" } };

/** The same shape naming which program a line came from. */
export const NamingAService: Story = { args: { label: "sonarr" } };

/** And counting what is left, where a list shows only the first few. */
export const CountingTheRest: Story = { args: { label: "+5 more" } };

/**
 * Nothing is wanted. A calm tag is drawn as a plain one and takes the quiet
 * ground: the mark carries the colour, so eight working services read as calm
 * rather than as a wall of green.
 */
export const NothingNeeded: Story = {
  args: {
    tone: "calm",
    label: severityWord("calm"),
    children: marking({ name: "tick", size: "small" }),
  },
};

/** Worth an eye, not an interruption. Tinted, and still outlined. */
export const WorthWatching: Story = {
  args: {
    tone: "watch",
    label: severityWord("watch"),
    children: marking({ name: "info", size: "small" }),
  },
};

/** It wants you now. On a screen of tags, this is the one with weight. */
export const NeedsYou: Story = {
  args: {
    tone: "alarm",
    label: severityWord("alarm"),
    children: marking({ name: "alert", size: "small" }),
  },
};
