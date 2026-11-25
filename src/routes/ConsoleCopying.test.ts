import { screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { console_, framed, saying, settle } from "./Console.testing";
import { raised } from "./fixture";
import { enveloped, fresh, stack, times, type Says } from "./served";
import { copyingNone, copyingNow, stalledRestore } from "../api/copyings";
import { nameOf } from "../lib/route";
import * as m from "../paraglide/messages.js";

/** Where the disk screen reads the copy running. */
const copying = "/api/copying";

/** The copy running, as the read answers it. */
const answered = (body: typeof copyingNow): Says => ({
  status: 200,
  body: enveloped("copying", body),
});

/** A stack whose copy read answers as it is told, and what was asked of it. */
function reading(said: Says): {
  sending: ReturnType<typeof stack>;
  asked: ReturnType<typeof fresh>;
} {
  const asked = fresh();
  return {
    sending: stack(
      { acting: {}, becoming: [], reading: { [copying]: said } },
      asked,
    ),
    asked,
  };
}

const goTo = async (place: Parameters<typeof nameOf>[0]): Promise<void> => {
  await userEvent.click(
    screen.getByRole("link", { name: new RegExp(nameOf(place)) }),
  );
};

const panelOf = (title: string) =>
  screen.queryByRole("region", { name: title });

describe("a backup or restore running, on the disk screen", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/storage");
  });

  it("is read on the way in and drawn as the read answers it", async () => {
    const { sending, asked } = reading(answered(copyingNow));
    console_({ sending });
    expect(
      await screen.findByRole("region", { name: m.copying_backup() }),
    ).toBeInTheDocument();
    expect(times(asked, copying)).toBe(1);
  });

  it("draws nothing where the read says none runs", async () => {
    const { sending, asked } = reading(answered(copyingNone));
    console_({ sending });
    await waitFor(() => {
      expect(times(asked, copying)).toBe(1);
    });
    await settle();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("follows the stream over the read, as it says a copy starts", async () => {
    const { sending } = reading(answered(copyingNone));
    console_({
      sending,
      fetching: saying([framed("copying", { running: stalledRestore })]),
    });
    const panel = await screen.findByRole("region", {
      name: m.copying_restore(),
    });
    expect(within(panel).getByRole("status")).toHaveTextContent(
      m.copying_part({ part: stalledRestore.part }),
    );
  });

  it("follows the stream over the read, as it says a copy ended", async () => {
    const { sending, asked } = reading(answered(copyingNow));
    const fetching: Fetching = saying([framed("copying", copyingNone)]);
    console_({ sending, fetching });
    await waitFor(() => {
      expect(times(asked, copying)).toBe(1);
    });
    await settle();
    expect(panelOf(m.copying_backup())).not.toBeInTheDocument();
  });

  it("passes on a refused key from the copy read", async () => {
    const onrefused = vi.fn();
    const { sending } = reading({ status: 401, body: "" });
    console_({ sending, onrefused });
    await waitFor(() => {
      expect(onrefused).toHaveBeenCalled();
    });
  });
});

describe("alerts that may be missing, on the overview", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  const missing = m.told_missing();

  it("says so after a partial replay, until the overview is left", async () => {
    console_({ fetching: saying([framed("replay", { alerts: "partial" })]) });
    expect(await screen.findByText(missing)).toBeInTheDocument();

    await goTo("checks");
    await goTo("overview");
    await settle();
    expect(screen.queryByText(missing)).not.toBeInTheDocument();
  });

  it("says so on the next opening of the overview, where it was said elsewhere", async () => {
    globalThis.history.replaceState(undefined, "", "/checks");
    console_({ fetching: saying([framed("replay", { alerts: "partial" })]) });
    await settle();
    await goTo("overview");
    expect(await screen.findByText(missing)).toBeInTheDocument();
  });

  it("says nothing after a whole replay", async () => {
    console_({
      fetching: saying([
        framed("replay", { alerts: "whole" }),
        framed("alert", raised),
      ]),
    });
    expect(
      await screen.findByRole("button", { name: m.action_told_dismiss() }),
    ).toBeInTheDocument();
    expect(screen.queryByText(missing)).not.toBeInTheDocument();
  });
});
