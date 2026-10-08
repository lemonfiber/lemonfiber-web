import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Code from "./Code.svelte";
import { drawn } from "../lib/qr";

const text = "jellyfin://media.lan:8096";

describe("Code", () => {
  it("is one image, named for a reader who cannot see it", () => {
    render(Code, { text, label: "Code for Jellyfin" });
    expect(
      screen.getByRole("img", { name: "Code for Jellyfin" }),
    ).toBeVisible();
  });

  it("draws the squares the encoder made, inside its quiet border", () => {
    const { container } = render(Code, { text, label: "Code for Jellyfin" });
    const { size, path } = drawn(text);
    const box = `0 0 ${String(size)} ${String(size)}`;
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", box);
    expect(container.querySelector("path")).toHaveAttribute("d", path);
  });
});
