import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Enclosure from "./Enclosure.svelte";
import { wiring, type Part } from "../../.storybook/snippets";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Surfaces/Enclosure",
  component: Enclosure,
  argTypes: { label: { control: "text" }, column: { control: "boolean" } },
} satisfies Meta<typeof Enclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

// The addresses, rates and paths below are the only literals here: they are
// data the API already formatted, not words this interface chose.

/** One tunnel, and the two programs that reach the internet through it. */
const insideTheTunnel: readonly Part[] = [
  { node: { name: "gluetun", state: "known", figure: "185.65.135.72 · NL" } },
  { wire: { label: m.schematic_carries() } },
  {
    box: {
      column: true,
      holds: [
        { node: { name: "qbittorrent", state: "known", figure: "4.1 MB/s" } },
        { node: { name: "sabnzbd", state: "quiet", figure: "0 B/s" } },
      ],
    },
  },
];

/** One disk, and the two places on it that share every file. */
const onTheDisk: readonly Part[] = [
  {
    node: {
      name: m.schematic_downloads(),
      figure: m.schematic_free({ size: "412 GB" }),
    },
  },
  { wire: { label: m.schematic_linked_into() } },
  {
    node: {
      name: m.schematic_library(),
      figure: m.schematic_linked_not_copied(),
    },
  },
];

/**
 * The box that carries the whole claim: both download programs sit inside the
 * tunnel, and the one connector out of it is the tunnel's own. The tag names
 * the box on the border, and names it to a screen reader as well, so what is
 * inside it is heard as inside it.
 */
export const TheTunnel: Story = {
  args: { label: m.schematic_tunnel(), children: wiring(...insideTheTunnel) },
};

/**
 * The Overview's hero, whole: the tunnel with its two programs branching off
 * one connector, then the disk both of them write to, then the library the
 * finished files are linked into.
 *
 * Nothing holds the flow itself, so the outer box draws nothing and claims
 * nothing. The two boxes that do hold something are the two that are drawn.
 */
export const HowYourStackIsWired: Story = {
  args: {
    children: wiring(
      { box: { label: m.schematic_tunnel(), holds: insideTheTunnel } },
      { wire: { label: m.schematic_lands_on() } },
      { box: { label: m.schematic_disk(), holds: onTheDisk } },
    ),
  },
};

/**
 * The same picture in the setup wizard, beside the question being answered:
 * the boxes stack, the connectors are dropped, and what has not been set up
 * yet is drawn as a box that is not there yet.
 */
export const WhatYoureBuilding: Story = {
  args: {
    column: true,
    children: wiring(
      {
        box: {
          label: m.schematic_tunnel(),
          column: true,
          holds: [
            {
              node: { name: "gluetun", state: "known", figure: "Mullvad · NL" },
            },
            {
              node: {
                name: "qbittorrent",
                state: "known",
                figure: m.schematic_port({ number: "51413" }),
              },
            },
            {
              node: {
                name: "sabnzbd",
                state: "known",
                figure: m.schematic_at_once({ count: "20" }),
              },
            },
          ],
        },
      },
      {
        box: {
          label: m.schematic_disk(),
          column: true,
          holds: [
            {
              node: {
                name: m.schematic_downloads(),
                figure: "/data/downloads",
              },
            },
            {
              node: {
                name: m.schematic_library(),
                figure: m.schematic_set_up_at({ step: "5" }),
                pending: true,
              },
            },
          ],
        },
      },
    ),
  },
};
