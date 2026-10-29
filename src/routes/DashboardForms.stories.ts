import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Dashboard from "./Dashboard.svelte";
import {
  chosenForm,
  controls,
  moment,
  notAnswering,
  rehearsed,
  stack,
} from "./fixture";

const answered = { kind: "answered", secondsAgo: 4 } as const;

/**
 * The overview with the forms in play: taken up, declared or not, and listed
 * or not. The rest of the screen stands as it does live.
 */
const meta = {
  title: "Surfaces/Dashboard/Forms",
  component: Dashboard,
  args: {
    stack: { ok: true, value: stack },
    programs: { ok: true, value: stack },
    moment,
    flow: "live",
    read: answered,
    live: answered,
    controls,
  },
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A form taken up. Three controls that could do nothing without one come
 * alive, the two that can mean the whole stack say they no longer do, and the
 * line above them says as much in words.
 */
export const AFormChosen: Story = {
  args: {
    controls: {
      ...controls,
      chosen: [chosenForm],
      preview: { ok: true, value: rehearsed },
      previewed: { kind: "answered", secondsAgo: 2 },
    },
  },
};

/**
 * Two forms taken up. What starting them would do is one answer for both: a
 * program they share is listed once.
 */
export const TwoFormsChosen: Story = {
  args: {
    controls: {
      ...controls,
      chosen: ["core", chosenForm],
      preview: {
        ok: true,
        value: {
          ...rehearsed,
          forms: ["core", chosenForm],
          services: ["gluetun", "prowlarr", ...rehearsed.services],
        },
      },
      previewed: { kind: "answered", secondsAgo: 2 },
    },
  },
};

/**
 * The stack declares no forms at all. Said in words rather than left as an
 * empty frame a reader has to interpret.
 */
export const NoFormsDeclared: Story = {
  args: {
    controls: { ...controls, forms: { ok: true, value: { forms: [] } } },
  },
};

/**
 * The listing did not answer. The panel says why in the source's own words,
 * and the controls that need a form stay silent because there is none to
 * choose.
 */
export const FormsCouldNotBeListed: Story = {
  args: {
    controls: {
      ...controls,
      forms: {
        ok: false,
        problem: { kind: "unreachable", message: notAnswering },
      },
    },
  },
};
