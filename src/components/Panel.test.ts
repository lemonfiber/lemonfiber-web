import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Panel from "./Panel.svelte";
import { ABLE } from "./able";
import {
  operatorAble,
  readKeyAble,
  switchedOffAble,
} from "../api/abilities.testing";
import type { Able } from "../lib/able";
import * as m from "../paraglide/messages.js";
import { stampFor } from "../lib/freshness";
import { wordFor } from "../lib/state";

const body = createRawSnippet(() => ({
  render: () => `<p data-testid="body">what the source said</p>`,
}));

const note = createRawSnippet(() => ({
  render: () => `<p data-testid="note">nothing here can be trusted</p>`,
}));

const answered = { kind: "answered", secondsAgo: 4 } as const;
const silent = { kind: "silent", secondsAgo: 240 } as const;

describe("Panel", () => {
  it("names itself with its title", () => {
    render(Panel, { title: "Disk", freshness: answered, children: body });
    expect(screen.getByRole("region", { name: "Disk" })).toBeInTheDocument();
  });

  // Rows style their own last one, which only works if the panel puts the
  // body's children where a row expects to find its siblings.
  it("puts the body's content directly inside the body", () => {
    const { container } = render(Panel, {
      title: "Disk",
      freshness: answered,
      children: body,
    });
    expect(
      container.querySelector(".body > [data-testid='body']"),
    ).not.toBeNull();
  });

  it("stamps when its own source last answered", () => {
    render(Panel, { title: "Disk", freshness: answered, children: body });
    expect(screen.getByText(stampFor(answered))).toBeInTheDocument();
  });

  it("marks the stamp with the trust that freshness carries", () => {
    render(Panel, { title: "Disk", freshness: answered, children: body });
    expect(
      screen.getByRole("img", { name: wordFor("known") }),
    ).toBeInTheDocument();
  });

  it("keeps the body's inset unless told to drop it", () => {
    const { container } = render(Panel, {
      title: "Disk",
      freshness: answered,
      children: body,
    });
    expect(container.querySelector(".body.flush")).toBeNull();
  });

  it("drops the body's inset for rows that meet the border", () => {
    const { container } = render(Panel, {
      title: "Disk",
      freshness: answered,
      children: body,
      flush: true,
    });
    expect(container.querySelector(".body.flush")).not.toBeNull();
  });
});

describe("when a panel's source is unreachable", () => {
  it("says so in place of the body", () => {
    render(Panel, {
      title: "Where things are found",
      freshness: silent,
      children: body,
      dead: note,
    });
    expect(screen.getByTestId("note")).toBeInTheDocument();
  });

  // Showing a figure beside "this cannot be trusted" is the contradiction the
  // dead state exists to prevent.
  it("shows none of what the source last said", () => {
    render(Panel, {
      title: "Where things are found",
      freshness: silent,
      children: body,
      dead: note,
    });
    expect(screen.queryByTestId("body")).toBeNull();
  });

  it("stamps how long the source has been silent", () => {
    render(Panel, {
      title: "Where things are found",
      freshness: silent,
      children: body,
      dead: note,
    });
    expect(screen.getByText(stampFor(silent))).toBeInTheDocument();
  });

  it("leaves every other panel on the screen alone", () => {
    render(Panel, {
      title: "Where things are found",
      freshness: silent,
      children: body,
      dead: note,
    });
    render(Panel, { title: "Disk", freshness: answered, children: body });

    expect(screen.getByTestId("body")).toBeInTheDocument();
    expect(screen.getByText(stampFor(answered))).toBeInTheDocument();
  });
});

describe("when a source falls silent under a panel already on screen", () => {
  it("swaps the body for the note without being remounted", async () => {
    const { rerender } = render(Panel, {
      title: "Where things are found",
      freshness: answered,
      children: body,
    });
    expect(screen.getByTestId("body")).toBeInTheDocument();

    await rerender({ freshness: silent, dead: note });

    expect(screen.getByTestId("note")).toBeInTheDocument();
    expect(screen.queryByTestId("body")).toBeNull();
    expect(screen.getByText(stampFor(silent))).toBeInTheDocument();
  });

  describe("drawn from a read", () => {
    /** The panel, drawn from the config read, beneath what `able` says. */
    const drawnFrom = (
      able: Able | undefined,
      answer?: Reading<unknown>,
    ): void => {
      render(Panel, {
        props: {
          title: "Settings",
          freshness: answered,
          children: body,
          dead: note,
          reads: "config",
          answer,
        },
        context: new Map([[ABLE, () => able]]),
      });
    };

    it("draws its body where the key may use the read, or where nothing was said", () => {
      drawnFrom(operatorAble);
      expect(screen.queryByText(m.able_unpermitted())).toBeNull();
      screen.getByRole("region", { name: "Settings" });
    });

    it("is silenced with one sentence saying why, in place of everything it draws", () => {
      drawnFrom(readKeyAble);
      const panel = screen.getByRole("region", { name: "Settings" });
      expect(panel).toHaveTextContent(m.able_unpermitted());
      expect(screen.queryByTestId("body")).toBeNull();
      expect(screen.queryByTestId("note")).toBeNull();
    });

    it("says why in lemonfiber's own words, where the read was refused with them", () => {
      const said = "This key may not read the settings.";
      drawnFrom(readKeyAble, {
        ok: false,
        problem: { kind: "declined", message: said },
      });
      expect(screen.getByText(said)).toBeVisible();
    });

    it("says a setting that is off has to be turned back on", () => {
      drawnFrom({
        ...switchedOffAble,
        capabilities: { "/api/config": "unconfigured" },
      });
      expect(screen.getByText(m.able_unconfigured())).toBeVisible();
    });

    it("is drawn as ever where nothing holds what the key can use", () => {
      render(Panel, {
        title: "Settings",
        freshness: answered,
        children: body,
        reads: "config",
      });
      expect(screen.getByTestId("body")).toBeInTheDocument();
    });
  });
});
