import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { household } from "./house";
import {
  enveloped,
  fresh,
  here,
  key,
  stack,
  started,
  times,
  type Asked,
  type Says,
} from "./served";
import { traced, walked } from "../api/found";
import * as m from "../paraglide/messages.js";

/** Where the trace panel reads where one item is. */
const trace = "/api/trace";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** The requests screen, against a stack whose finding answers as it is told. */
function seeking(
  asked: Asked,
  acting: Partial<Record<string, readonly Says[]>>,
  becoming: readonly Says[] = [],
): void {
  globalThis.history.replaceState(undefined, "", "/requests");
  const sending = stack(
    {
      acting,
      becoming,
      reading: {
        "/api/requests": {
          status: 200,
          body: enveloped("household", household),
        },
        [trace]: { status: 200, body: enveloped("trace", traced) },
      },
    },
    asked,
  );
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
}

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("finding things from the requests screen", () => {
  it("asks before a walk, then walks it and follows it to its end", async () => {
    const sent = fresh();
    seeking(sent, { walkthrough: [started] }, [
      started,
      { status: 200, body: enveloped("walkthrough", walked) },
    ]);
    await screen.findByText(m.action_walk());

    await userEvent.type(screen.getByLabelText(m.walk_item()), "Sintel");
    await press(m.action_walk());
    expect(sent.posted).toStrictEqual([]);
    await press(m.action_walk_yes());

    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/walkthrough",
        body: JSON.stringify({ item: "Sintel" }),
      },
    ]);
    const asked = screen.getByRole("status", { name: m.walk_asked() });
    expect(await within(asked).findByText(walked.proves)).toBeInTheDocument();
  });

  it("looks an item up without changing anything", async () => {
    const sent = fresh();
    seeking(sent, {});
    await screen.findByText(m.action_trace());

    await userEvent.type(screen.getByLabelText(m.trace_term()), "The Expanse");
    await press(m.action_trace());

    expect(
      await screen.findByRole("list", { name: m.trace_said() }),
    ).toBeInTheDocument();
    expect(times(sent, trace)).toBe(1);
    expect(sent.posted).toStrictEqual([]);
  });

  // A refusal is lemonfiber's own sentence, and reads as a refusal.
  it("says a refused search in lemonfiber's words", async () => {
    const none = "No indexer is configured, so there is nothing to search.";
    seeking(fresh(), { search: [{ status: 409, body: none }] });
    await screen.findByText(m.action_search());

    await userEvent.type(screen.getByLabelText(m.trace_term()), "Arrival");
    await press(m.action_search());

    const asked = screen.getByRole("status", { name: m.trace_asked() });
    expect(await within(asked).findByText(none)).toBeInTheDocument();
    expect(within(asked).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });
});
