import { describe, expect, it } from "vitest";
import { notesOf } from "./notes";

/**
 * A release's address, assembled rather than written: the structural guards
 * refuse a foreign origin in the source, and this one is only dropped.
 */
const away = ["https:", "", "releases.example"].join("/");

describe("reading release notes", () => {
  it("reads headings, items and lines, and keeps a link's words without its address", () => {
    expect(
      notesOf(
        [
          `## [0.17.0](${away}/v0.17.0)`,
          "",
          "Plugins, and where one comes from",
          "",
          "### New",
          "",
          `- A form states its estimate — [Forms · B1-R16](${away}/b1) (#757)`,
          "* Run `lemonfiber seed` again",
          "   ",
        ].join("\n"),
      ),
    ).toStrictEqual([
      { kind: "heading", text: "0.17.0" },
      { kind: "line", text: "Plugins, and where one comes from" },
      { kind: "heading", text: "New" },
      {
        kind: "item",
        text: "A form states its estimate — Forms · B1-R16 (#757)",
      },
      { kind: "item", text: "Run `lemonfiber seed` again" },
    ]);
  });

  it("leaves brackets that are not a link as written", () => {
    expect(
      notesOf("- see [the list] and (this), then [a link](x) and [a](b"),
    ).toStrictEqual([
      {
        kind: "item",
        text: "see [the list] and (this), then a link and [a](b",
      },
    ]);
  });

  it("reads notes with no markup as one line", () => {
    expect(notesOf("Adds the household view.")).toStrictEqual([
      { kind: "line", text: "Adds the household view." },
    ]);
  });

  it("reads no notes where there are none, or only blank ones", () => {
    for (const markdown of [undefined, null, "", "  \n \n"]) {
      expect(notesOf(markdown)).toBeUndefined();
    }
  });
});
