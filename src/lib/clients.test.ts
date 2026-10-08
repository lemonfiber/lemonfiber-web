import { describe, expect, it } from "vitest";
import {
  causeLines,
  deviceLines,
  wordOfSupport,
  type Cause,
  type Device,
} from "./clients";
import { phone, television } from "../api/apps";
import * as m from "../paraglide/messages.js";

describe("one kind of device", () => {
  it("names the app to use, that it is open source, and how well it is served", () => {
    expect(deviceLines(phone)).toStrictEqual([
      m.clients_use({ client: "Findroid" }),
      m.clients_good(),
    ]);
  });

  it("says an app is not open source, and passes the caution and what to do instead on", () => {
    expect(deviceLines(television)).toStrictEqual([
      m.clients_use_closed({ client: "Jellyfin for Tizen" }),
      m.clients_poor(),
      television.caution,
      television.instead,
    ]);
  });

  it("has a word for how well every device is served", () => {
    expect(wordOfSupport("workable")).toBe(m.clients_workable());
    expect(wordOfSupport("fallback")).toBe(m.clients_fallback());
    expect(wordOfSupport("perfect" as Device["support"])).toBe(
      m.clients_support_other(),
    );
  });
});

describe("what could be behind a symptom", () => {
  it("says what is wrong, how to tell, and what to do", () => {
    const cause: Cause = {
      because: "The device cannot play the file as it is.",
      tell: "Other files play smoothly.",
      fix: "Choose a lighter preset.",
    };
    expect(causeLines(cause)).toStrictEqual([
      "The device cannot play the file as it is.",
      m.clients_tell({ tell: "Other files play smoothly." }),
      m.clients_fix({ fix: "Choose a lighter preset." }),
    ]);
  });
});
