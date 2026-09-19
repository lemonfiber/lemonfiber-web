import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Unlock from "./Unlock.svelte";
import type { Arrived } from "../api/admitting";

const session = ["a", "session", "secret"].join("-");

const answering = (came: Arrived) => (): Promise<Arrived> =>
  Promise.resolve(came);

const meta = {
  title: "Surfaces/Unlock",
  component: Unlock,
  args: {
    onopen: () => undefined,
    onsignin: answering({ at: "admitted", token: session }),
  },
} satisfies Meta<typeof Unlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The first screen anyone sees. A password is exchanged once for a session, and
 * the same form takes the operator's own and a household member's — which of
 * the two a pair belongs to is lemonfiber's answer, so nothing here chooses.
 * Below it, the key a run printed, which is the whole of what somebody sitting
 * at the terminal needs.
 */
export const TheDoor: Story = {};

/**
 * Nothing answers a password, so the key is the whole screen. This is what a
 * page reduced to the one way in looks like.
 */
export const TheKeyAlone: Story = { args: { onsignin: undefined } };

/**
 * A pair the run does not hold. Which half it was is not asked about and is not
 * shown: naming it would say which accounts exist to whoever is guessing.
 */
export const APairNothingRecognised: Story = {
  args: { onsignin: answering({ at: "not-recognised" }) },
};

/**
 * Answered too often. The refusal is lemonfiber's own sentence and says how
 * long is left, so a reader waits rather than retrying into the limit.
 */
export const AnsweredTooOften: Story = {
  args: {
    onsignin: answering({
      at: "declined",
      said: "Too many answers. Try again in 4 minutes.",
    }),
  },
};

/**
 * The same screen, arrived at because a run stopped taking what the page was
 * holding. It says so where a reader who cannot see the screen change is told,
 * and the console it replaced is gone.
 */
export const AfterTheRunTurnedTheConsoleAway: Story = {
  args: { refused: true },
};
