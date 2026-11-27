import { describe, expect, it } from "vitest";
import { actedAt, drawn, readAt, silenced, standingAt } from "./able";
import {
  operatorAble,
  readKeyAble,
  switchedOffAble,
} from "../api/abilities.testing";
import * as m from "../paraglide/messages.js";

describe("what one request comes to for the signed-in key", () => {
  it("is named by the path it is served at", () => {
    expect(readAt("quality")).toBe("/api/quality");
    expect(actedAt("quality-set")).toBe("/api/actions/quality-set");
  });

  it("is what lemonfiber said, absent where the stack has no such request, and nothing before it said", () => {
    expect(standingAt(readKeyAble, readAt("config"))).toBe("unpermitted");
    expect(standingAt(operatorAble, readAt("history"))).toBe("absent");
    expect(standingAt(undefined, readAt("config"))).toBeUndefined();
  });
});

describe("a control asking for an action", () => {
  it("is drawn where the key may use it, or where nothing was said", () => {
    expect(drawn(operatorAble, "quality-set")).toBe(true);
    expect(drawn(undefined, "quality-set")).toBe(true);
  });

  it("is not drawn where the key may not, a setting is off, or the stack has no such action", () => {
    expect(drawn(readKeyAble, "quality-set")).toBe(false);
    expect(drawn(switchedOffAble, "quality-set")).toBe(false);
    expect(drawn(operatorAble, "restart")).toBe(false);
  });
});

describe("a panel drawn from a read", () => {
  it("is silenced by nothing where the key may use it, or where nothing was said", () => {
    expect(silenced(operatorAble, "quality")).toBeUndefined();
    expect(silenced(undefined, "config")).toBeUndefined();
  });

  it("is silenced with one sentence saying why", () => {
    expect(silenced(readKeyAble, "config")).toBe(m.able_unpermitted());
    expect(silenced(switchedOffAble, "quality")).toBe(m.able_unconfigured());
    expect(silenced(operatorAble, "history")).toBe(m.able_absent());
  });

  it("is silenced in lemonfiber's own words, where the read was refused with them", () => {
    const said = "This key may not read the settings.";
    expect(
      silenced(readKeyAble, "config", {
        ok: false,
        problem: { kind: "declined", message: said },
      }),
    ).toBe(said);
    expect(
      silenced(readKeyAble, "config", { ok: true, value: undefined }),
    ).toBe(m.able_unpermitted());
  });
});
