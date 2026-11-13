import { describe, expect, it } from "vitest";
import {
  exceptionLine,
  presetLines,
  raisedLine,
  type Notification,
} from "./alerts";
import { listed } from "./listed";
import { alerts } from "../api/alerting";
import * as m from "../paraglide/messages.js";

describe("what the operator is told about", () => {
  it("names the preset in force, and what it means in lemonfiber's words", () => {
    expect(presetLines(alerts)).toStrictEqual([
      m.alerts_preset({ preset: "quiet" }),
      alerts.means,
    ]);
  });

  it.each([
    ["problem", m.alerts_kind_problem()],
    ["completion", m.alerts_kind_completion()],
    ["update", m.alerts_kind_update()],
    ["backup", m.alerts_kind_backup()],
    ["request", m.alerts_kind_request()],
    ["member", m.alerts_kind_member()],
    ["ready", m.alerts_kind_ready()],
    ["pondered" as Notification, m.alerts_kind_other()],
  ] as const)("names the sort of thing %s tells about", (kind, words) => {
    expect(raisedLine({ ...alerts, kinds: [kind] })).toBe(
      m.alerts_raised({ kinds: words }),
    );
  });

  it("lists every sort of thing the stack tells about, in its order", () => {
    expect(raisedLine(alerts)).toBe(
      m.alerts_raised({
        kinds: listed([
          m.alerts_kind_problem(),
          m.alerts_kind_completion(),
          m.alerts_kind_update(),
          m.alerts_kind_backup(),
        ]),
      }),
    );
  });

  it("says so where the stack tells about nothing", () => {
    expect(raisedLine({ ...alerts, kinds: [] })).toBe(m.alerts_raised_none());
  });

  it("says of each kind set apart whether it is told or not", () => {
    expect(alerts.exceptions.map(exceptionLine)).toStrictEqual([
      m.alerts_wanted({ kind: "disk-filling" }),
      m.alerts_unwanted({ kind: "update-available" }),
    ]);
  });
});
