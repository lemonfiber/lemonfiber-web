import { describe, expect, it } from "vitest";
import { exceptionLine, presetLines } from "./alerts";
import { alerts } from "../api/alerting";
import * as m from "../paraglide/messages.js";

describe("what the operator is told about", () => {
  it("names the preset in force, and what it means in lemonfiber's words", () => {
    expect(presetLines(alerts)).toStrictEqual([
      m.alerts_preset({ preset: "quiet" }),
      alerts.means,
    ]);
  });

  it("says of each kind set apart whether it is told or not", () => {
    expect(alerts.exceptions.map(exceptionLine)).toStrictEqual([
      m.alerts_wanted({ kind: "disk-filling" }),
      m.alerts_unwanted({ kind: "update-available" }),
    ]);
  });
});
