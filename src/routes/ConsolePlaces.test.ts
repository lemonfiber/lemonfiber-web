import { screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Sending } from "@lemonfiber/sdk-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { scrollback, stack } from "./fixture";
import { diagnosis, diskChecks } from "./findings";
import { household } from "./house";
import { nameOf } from "../lib/route";
import * as m from "../paraglide/messages.js";
import { enveloped } from "./served";
import { formsSaid, refusing, console_ } from "./Console.testing";

describe("going somewhere else", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("answers a plain press itself, and puts the address in the bar", async () => {
    console_();
    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(nameOf("checks")) }),
    );

    expect(globalThis.location.pathname).toBe("/checks");
    expect(
      await screen.findByRole("region", { name: m.panel_findings() }),
    ).toBeInTheDocument();
  });

  // A modified press is asking the browser for a second tab, and a page that
  // answered it would take that away.
  it("leaves a modified press to the browser", async () => {
    console_();
    const link = await screen.findByRole("link", {
      name: new RegExp(nameOf("checks")),
    });

    link.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        metaKey: true,
      }),
    );

    expect(globalThis.location.pathname).toBe("/");
  });

  it("follows the back button", async () => {
    console_();
    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(nameOf("logs")) }),
    );
    expect(
      await screen.findByRole("region", { name: m.panel_scrollback() }),
    ).toBeInTheDocument();

    globalThis.history.replaceState(undefined, "", "/");
    globalThis.dispatchEvent(new PopStateEvent("popstate"));

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: m.panel_standing() }),
      ).toBeInTheDocument();
    });
  });

  it("opens on the place the address names", async () => {
    globalThis.history.replaceState(undefined, "", "/requests");
    console_();
    expect(
      await screen.findByRole("region", { name: nameOf("requests") }),
    ).toBeInTheDocument();
  });

  it("opens on the disk where the address names it", async () => {
    globalThis.history.replaceState(undefined, "", "/storage");
    console_();
    expect(
      await screen.findByRole("region", { name: m.panel_disk_findings() }),
    ).toBeInTheDocument();
  });
});

/**
 * A transport that answers each read with what that endpoint answers.
 *
 * The scrollback is the one that is not one document: it is answered the way
 * the endpoint answers it, one envelope to a line.
 */
const readings: Sending = (url) => {
  const said = (body: string) =>
    Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(body),
    });

  if (url.includes("/api/forms")) return said(formsSaid(url));
  if (url.includes("/api/checks")) return said(enveloped("doctor", diagnosis));
  if (url.includes("/api/storage"))
    return said(enveloped("doctor", diskChecks));
  if (url.includes("/api/requests")) {
    return said(enveloped("household", household));
  }
  if (url.includes("/api/logs")) {
    return said(
      scrollback.map((line) => `${enveloped("log", line)}\n`).join(""),
    );
  }
  return said(enveloped("status", stack));
};

/**
 * A transport that answers the checks and leaves the requests hanging.
 *
 * A stamp dropped on the way in is only there to be read while the place being
 * arrived at has not answered yet.
 */
const unanswered: Sending = (url, init) => {
  if (url.includes("/api/requests")) return new Promise(() => undefined);
  return readings(url, init);
};

/**
 * A transport that holds the answers at one address until they are let go, and
 * never answers the checks at all.
 *
 * What that leaves is a reader standing on a screen whose own reading has not
 * come back, while the one they left answers behind them.
 */
function heldBack(at: string): { sending: Sending; answer: () => void } {
  let answer!: () => void;
  const held = new Promise<void>((resolve) => {
    answer = resolve;
  });

  const sending: Sending = async (url, init) => {
    if (url.includes("/api/checks")) return new Promise(() => undefined);
    if (url.includes(at)) await held;
    return readings(url, init);
  };

  return { sending, answer };
}

/** A minute, in the milliseconds a clock is moved by. */
const A_MINUTE = 60_000;

/** Go where the menu leads, and wait for what is there. */
const goTo = async (place: Parameters<typeof nameOf>[0]): Promise<void> => {
  await userEvent.click(
    screen.getByRole("link", { name: new RegExp(nameOf(place)) }),
  );
};

describe("what each place is drawn from", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("draws the checks from the run they answer with", async () => {
    console_({ sending: readings });
    await goTo("checks");

    expect(
      await screen.findByRole("heading", {
        name: "Every service is answering its own health check",
      }),
    ).toBeInTheDocument();
  });

  it("draws the disk from the checks about it", async () => {
    console_({ sending: readings });
    await goTo("storage");

    expect(
      await screen.findByRole("heading", {
        name: "Downloads and the library are on one filesystem",
      }),
    ).toBeInTheDocument();
  });

  // The scrollback is answered one envelope to a line, which a whole-body parse
  // reads as malformed the moment there is more than one of them.
  it("draws every line the scrollback answered with", async () => {
    console_({ sending: readings });
    await goTo("logs");

    expect(
      await screen.findByText("calibre-web-automated"),
    ).toBeInTheDocument();

    const panel = screen.getByRole("region", { name: m.panel_scrollback() });
    expect(within(panel).getAllByRole("listitem")).toHaveLength(
      scrollback.length,
    );
  });

  it("draws what the household asked for", async () => {
    console_({ sending: readings });
    await goTo("requests");

    expect(await screen.findByText("The Expanse")).toBeInTheDocument();
  });

  // A stamp says when the reading behind the screen being read answered, and
  // the one left behind by the screen before it would date this one by another
  // screen's clock.
  it("drops the stamp on the way into a place", async () => {
    console_({ sending: unanswered });
    await goTo("checks");
    await screen.findAllByText(
      m.fresh_answered({ span: m.span_seconds({ count: 0 }) }),
    );

    await goTo("requests");

    expect(screen.getAllByText(m.fresh_never()).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        m.fresh_answered({ span: m.span_seconds({ count: 0 }) }),
      ),
    ).toBeNull();
  });

  // `noted` is called by whichever request resolved, not by whichever screen is
  // being read. An answer that landed after the reader moved on would put one
  // screen's clock on another's.
  it("takes no stamp from an answer the screen before it asked for", async () => {
    const holding = heldBack("/api/requests");
    console_({ sending: holding.sending });
    await goTo("requests");
    await goTo("checks");

    holding.answer();
    await waitFor(() => {
      expect(screen.getByText(m.waiting_answer())).toBeInTheDocument();
    });

    expect(screen.getAllByText(m.fresh_never()).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        m.fresh_answered({ span: m.span_seconds({ count: 0 }) }),
      ),
    ).toBeNull();
  });

  // A stamp is a span rather than a moment. One written down when the source
  // answered says "just now" for as long as the screen is open, and the whole
  // apparatus is there to say how much a panel can be trusted.
  it("ages a stamp as the clock moves", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      console_({ sending: readings });
      await screen.findAllByText(
        m.fresh_answered({ span: m.span_seconds({ count: 0 }) }),
      );

      await vi.advanceTimersByTimeAsync(A_MINUTE);

      expect(
        screen.getAllByText(
          m.fresh_answered({ span: m.span_minutes({ count: 1 }) }),
        ).length,
      ).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });

  // A screen drawn from several readings is stamped by them together, and by
  // none of them once the reader has gone elsewhere.
  it("takes no stamp from the readings of a screen the reader left", async () => {
    const holding = heldBack("/api/space");
    console_({ sending: holding.sending });
    await goTo("storage");
    await goTo("checks");

    holding.answer();
    // The readings resolve together, a few turns after the one held is let go.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getAllByText(m.fresh_never()).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        m.fresh_answered({ span: m.span_seconds({ count: 0 }) }),
      ),
    ).toBeNull();
  });

  it("says so when one of a screen's readings is refused this run's key", async () => {
    const refused = vi.fn();
    console_({
      sending: (url, init) =>
        url.includes("/api/outbound")
          ? refusing(url, init)
          : readings(url, init),
      onrefused: refused,
    });
    await goTo("settings");

    await waitFor(() => {
      expect(refused).toHaveBeenCalled();
    });
  });

  it("says so when a place is asked for with a key this run refuses", async () => {
    const refused = vi.fn();
    console_({ sending: refusing, onrefused: refused });
    await goTo("logs");

    await waitFor(() => {
      expect(refused).toHaveBeenCalled();
    });
  });
});
