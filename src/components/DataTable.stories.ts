import type { Meta, StoryObj } from "@storybook/svelte-vite";
import DataTable from "./DataTable.svelte";
import {
  measuring,
  naming,
  pressing,
  showing,
  stating,
} from "../../.storybook/snippets";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Surfaces/DataTable",
  component: DataTable,
  argTypes: { columns: { control: "object" }, rows: { control: "object" } },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// The release names, the figures and the words on a source's own tags are the
// only literals here: what a household is downloading and how fast is data the
// API already formatted, not a word this interface chose.

const howFar = m.meter_how_far();

/**
 * Every shape a cell takes, in one table: a name, a tag saying where it came
 * from, a bar, two figures carrying their own trust, and a clock. The three
 * figure columns read from the right, so the units line up down the table
 * rather than the first digits.
 */
export const EverythingMoving: Story = {
  args: {
    label: m.panel_moving(),
    columns: [
      { head: m.head_what() },
      { head: m.head_how() },
      { head: m.head_how_far(), width: "160px" },
      { head: m.head_speed(), kind: "figure" },
      { head: m.head_time_left(), kind: "figure" },
      { head: m.head_checked(), kind: "figure" },
    ],
    rows: [
      {
        kind: "answered",
        key: "ubuntu",
        cells: [
          { kind: "words", text: "Ubuntu 24.04.1 LTS" },
          { kind: "drawn", draw: naming({ label: "torrent" }) },
          {
            kind: "drawn",
            draw: measuring({ part: 0.64, label: howFar }),
          },
          {
            kind: "drawn",
            draw: showing({ state: "known", figure: "4.1 MB/s" }),
          },
          {
            kind: "drawn",
            draw: showing({ state: "known", figure: "12 min" }),
          },
          { kind: "words", text: "4s", emphasis: "quiet" },
        ],
      },
      {
        kind: "answered",
        key: "debian",
        cells: [
          { kind: "words", text: "Debian 13 netinst" },
          { kind: "drawn", draw: naming({ label: "usenet" }) },
          {
            kind: "drawn",
            draw: measuring({ part: 0.91, label: howFar, state: "quiet" }),
          },
          {
            kind: "drawn",
            draw: showing({ state: "quiet", figure: "0 B/s" }),
          },
          {
            kind: "drawn",
            draw: showing({
              state: "unknown",
              absent: m.value_cannot_say(),
            }),
          },
          { kind: "words", text: "4m 20s", emphasis: "quiet" },
        ],
      },
      {
        kind: "answered",
        key: "bear",
        cells: [
          { kind: "words", text: "The Bear — series 3, episode 4" },
          { kind: "drawn", draw: naming({ label: "usenet" }) },
          {
            kind: "drawn",
            draw: stating({ state: "stopped", label: m.eyebrow_stuck() }),
          },
          { kind: "words", text: "—", emphasis: "quiet" },
          { kind: "words", text: "—", emphasis: "quiet" },
          { kind: "words", text: "19:51", emphasis: "quiet" },
        ],
      },
    ],
  },
};

/**
 * The same figures in a panel too narrow for headings. The columns still know
 * which of them are figures, so the table reads the same without them — and
 * what would have been a "how" heading becomes a caption under each name.
 */
export const DownloadingNow: Story = {
  args: {
    label: m.panel_downloading(),
    columns: [
      { width: "44%" },
      { width: "160px" },
      { kind: "figure" },
      { kind: "figure" },
    ],
    rows: [
      {
        kind: "answered",
        key: "ubuntu",
        cells: [
          {
            kind: "words",
            text: "Ubuntu 24.04.1 LTS",
            caption: m.caption_from({ source: "a torrent" }),
            below: true,
          },
          { kind: "drawn", draw: measuring({ part: 0.64, label: howFar }) },
          {
            kind: "drawn",
            draw: showing({ state: "known", figure: "4.1 MB/s" }),
          },
          {
            kind: "drawn",
            draw: showing({ state: "known", figure: "12 min" }),
          },
        ],
      },
      {
        kind: "answered",
        key: "debian",
        cells: [
          {
            kind: "words",
            text: "Debian 13 netinst",
            caption: m.caption_from({ source: "usenet" }),
            below: true,
          },
          {
            kind: "drawn",
            draw: measuring({ part: 0.91, label: howFar, state: "quiet" }),
          },
          {
            kind: "drawn",
            draw: showing({ state: "quiet", figure: "0 B/s" }),
          },
          {
            kind: "drawn",
            draw: showing({
              state: "unknown",
              absent: m.value_cannot_say(),
            }),
          },
        ],
      },
    ],
  },
};

/**
 * One source has stopped answering, and the table says so on that row and
 * nowhere else. The row keeps its name, blanks the columns it can no longer
 * stand behind, and the two rows above it stay exactly as trustworthy as they
 * were.
 */
export const OneSourceNotAnswering: Story = {
  args: {
    label: m.panel_waiting_in_line(),
    columns: [
      { head: m.head_program() },
      { head: m.head_waiting(), kind: "figure" },
      { head: m.eyebrow_stuck(), kind: "figure" },
      { head: m.head_what_that_means() },
    ],
    rows: [
      {
        kind: "answered",
        key: "sonarr",
        cells: [
          { kind: "words", text: "sonarr", caption: m.caption_your_series() },
          { kind: "words", text: "12" },
          { kind: "words", text: "1", emphasis: "alarm" },
          { kind: "words", text: m.figure_gave_up(), emphasis: "alarm" },
        ],
      },
      {
        kind: "answered",
        key: "radarr",
        cells: [
          { kind: "words", text: "radarr", caption: m.caption_your_films() },
          { kind: "words", text: "3" },
          { kind: "words", text: "0" },
          { kind: "words", text: m.figure_nothing_wrong(), emphasis: "quiet" },
        ],
      },
      { kind: "silent", key: "prowlarr", name: "prowlarr" },
    ],
  },
};

/**
 * A row per program, and a button per row. The control column is as narrow as
 * the widest button and never wraps, so the columns before it keep the width —
 * and the one program that wants you is the only firm button on the screen.
 */
export const WhatRunsYourStack: Story = {
  args: {
    label: m.panel_programs(),
    columns: [
      { head: m.head_program() },
      { head: m.head_what_it_does() },
      { head: m.head_state() },
      { head: m.head_running_for(), kind: "figure" },
      { kind: "control" },
    ],
    rows: [
      {
        kind: "answered",
        key: "gluetun",
        cells: [
          { kind: "words", text: "gluetun", emphasis: "lead" },
          { kind: "words", text: m.service_gluetun(), emphasis: "quiet" },
          { kind: "drawn", draw: stating({ state: "known" }) },
          {
            kind: "drawn",
            draw: showing({ state: "known", figure: "6d 4h" }),
          },
          { kind: "drawn", draw: pressing({ label: m.action_restart() }) },
        ],
      },
      {
        kind: "answered",
        key: "sabnzbd",
        cells: [
          { kind: "words", text: "sabnzbd", emphasis: "lead" },
          { kind: "words", text: m.service_sabnzbd(), emphasis: "quiet" },
          { kind: "drawn", draw: stating({ state: "quiet" }) },
          { kind: "drawn", draw: showing({ state: "quiet", figure: "4m" }) },
          { kind: "drawn", draw: pressing({ label: m.action_restart() }) },
        ],
      },
      {
        kind: "answered",
        key: "prowlarr",
        cells: [
          { kind: "words", text: "prowlarr", emphasis: "lead" },
          { kind: "words", text: m.service_prowlarr(), emphasis: "quiet" },
          { kind: "drawn", draw: stating({ state: "stopped" }) },
          {
            kind: "drawn",
            draw: showing({
              state: "stopped",
              absent: m.value_not_running(),
            }),
          },
          {
            kind: "drawn",
            draw: pressing({ label: m.action_start_it(), weight: "firm" }),
          },
        ],
      },
    ],
  },
};
