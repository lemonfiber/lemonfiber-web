import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Command from "./Command.svelte";

const up =
  "docker compose --project-directory /srv/lemonfiber --env-file /srv/lemonfiber/.env up -d";

describe("Command", () => {
  it("is announced by what running it does, and holds the command word for word", () => {
    render(Command, { label: "Start without lemonfiber", text: up });
    const figure = screen.getByRole("figure", {
      name: "Start without lemonfiber",
    });
    expect(figure).toHaveTextContent(up);
    expect(screen.getByText(up).tagName).toBe("CODE");
  });
});
