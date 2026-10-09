import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ShowAll from "./ShowAll.svelte";
import { SHORT, Shortening } from "../lib/shortening.svelte";
import * as m from "../paraglide/messages.js";

/** A list one longer than is shown before the rest is asked for. */
const long = Array.from({ length: SHORT + 1 }, (_, at) => `row ${String(at)}`);

describe("showing the whole of a long list", () => {
  it("says how many there are, shows them all, and goes back to the first few", async () => {
    const shortening = new Shortening();
    render(ShowAll, { items: long, shortening });
    expect(shortening.of(long)).toHaveLength(SHORT);

    await userEvent.click(
      screen.getByRole("button", {
        name: m.action_show_all({ count: long.length }),
      }),
    );
    expect(shortening.of(long)).toStrictEqual(long);

    await userEvent.click(
      screen.getByRole("button", { name: m.action_show_fewer() }),
    );
    expect(shortening.of(long)).toHaveLength(SHORT);
  });

  it("offers nothing for a list short enough to show whole", () => {
    const short = long.slice(0, SHORT);
    const shortening = new Shortening();
    render(ShowAll, { items: short, shortening });
    expect(screen.queryByRole("button")).toBeNull();
    expect(shortening.of(short)).toStrictEqual(short);
  });

  it("keeps an entry further down in view where it must stay, until shown whole", () => {
    const shortening = new Shortening();
    const last = long.at(-1);
    expect(shortening.keeping(long, (row) => row === last)).toStrictEqual([
      ...long.slice(0, SHORT),
      last,
    ]);
    shortening.flip();
    expect(shortening.keeping(long, () => false)).toStrictEqual(long);
  });

  it("shortens several lists under one press, counting them all", async () => {
    const shortening = new Shortening();
    const few = long.slice(0, 2);
    render(ShowAll, { groups: [few, long], shortening });

    await userEvent.click(
      screen.getByRole("button", {
        name: m.action_show_all({ count: few.length + long.length }),
      }),
    );
    expect(shortening.of(long)).toStrictEqual(long);
  });

  it("keeps as many as it is told to", () => {
    expect(new Shortening(2).of(long)).toHaveLength(2);
  });
});
