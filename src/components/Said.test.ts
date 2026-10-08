import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Said from "./Said.svelte";
import { Explained, explainedIn } from "../lib/explained.svelte";
import { seed, vocabulary } from "../api/vocabularies";

const line = "Seeding uses upload until it stops.";

/** Explaining, with the glossary held and explaining on or off. */
function explaining(on = true): Explained {
  const explained = new Explained();
  explained.hold({ ok: true, value: vocabulary });
  explained.on = on;
  return explained;
}

describe("Said", () => {
  it("is the line and nothing else where nothing explains", () => {
    const { container } = render(Said, { text: line });
    expect(container.textContent).toBe(line);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("reads as written with each term pressable for what it means", async () => {
    const { container } = render(Said, {
      props: { text: line },
      context: explainedIn(explaining()),
    });
    expect(container.textContent).toBe(line);

    await userEvent.click(screen.getByRole("button", { name: "Seeding" }));
    expect(await screen.findByText(seed.short)).toBeVisible();
  });

  it("marks nothing once the reader has turned explaining off", () => {
    render(Said, {
      props: { text: line },
      context: explainedIn(explaining(false)),
    });
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("marks nothing before the glossary is held", () => {
    render(Said, {
      props: { text: line },
      context: explainedIn(new Explained()),
    });
    expect(screen.queryByRole("button")).toBeNull();
  });
});
