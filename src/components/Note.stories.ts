import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Note from "./Note.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Note",
  component: Note,
} satisfies Meta<typeof Note>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What the section is for, before the first setting in it is read. Two
 * sentences: what the thing does, and the one fact about it that surprises
 * people.
 */
export const WhatTheSectionIsFor: Story = {
  args: { prose: m.note_quota() },
};

/**
 * The measure doing its work. A note long enough to wrap stops at 68
 * characters rather than running the width of the pane.
 */
export const AtFullMeasure: Story = {
  args: { prose: m.note_backup() },
};
