import { describe, expect, it } from "vitest";
import { linkable } from "./linked";
import { addressAt } from "../api/hearings";

const web = addressAt("house.local:5055");
const secure = ["https:", "", "house.example"].join("/");

describe("an address the stack handed over", () => {
  it("is linked where it is a web address", () => {
    expect(linkable(web)).toBe(web);
    expect(linkable(secure)).toBe(secure);
  });

  it.each([
    ["a script", ["javascript", "alert(1)"].join(":")],
    ["a script in mixed case", ["JaVaScRiPt", "alert(1)"].join(":")],
    ["inline data", ["data", "text/html,<b>hi</b>"].join(":")],
    ["an old script", ["vbscript", "msgbox(1)"].join(":")],
    ["one relative to this page's scheme", "//house.local:5055"],
    ["one that does not parse", "not an address"],
    ["a script behind a space", ` ${["javascript", "alert(1)"].join(":")}`],
    ["a script behind a tab", `\t${["javascript", "alert(1)"].join(":")}`],
    [
      "a script behind a control character",
      `\u0001${["javascript", "alert(1)"].join(":")}`,
    ],
    ["a web address behind a space", ` ${web}`],
    ["a web address with a line break in it", `${web}\n`],
    ["a web address with a control character in it", `${web}\u0085`],
  ])("is not linked where it is %s", (_, address) => {
    expect(linkable(address)).toBeUndefined();
  });
});
