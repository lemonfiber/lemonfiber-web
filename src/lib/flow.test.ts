import { describe, expect, it } from "vitest";
import {
  everyFlow,
  saidOfFlow,
  saidOfTelemetry,
  toneOfFlow,
  toneOfTelemetry,
} from "./flow";
import { everyTone } from "./state";
import { everyTelemetry, type Telemetry } from "./wire";

/**
 * A reading from a lemonfiber whose vocabulary is wider than this build's.
 *
 * The wire version stays one number while words are added under it, so a running
 * binary can answer with one the generated types do not name. There is no way to
 * write one but to say so.
 */
const unnamedTelemetry = "sampling" as unknown as Telemetry;

describe("toneOfFlow", () => {
  it.each(everyFlow)("gives %s a severity the interface has", (flow) => {
    expect(everyTone).toContain(toneOfFlow(flow));
  });

  // Opening is neither good nor bad news, and a connection carrying figures is
  // the ordinary case. Neither may compete with one that has broken.
  it("keeps a connection that is working quiet", () => {
    expect(toneOfFlow("opening")).toBe("calm");
    expect(toneOfFlow("live")).toBe("calm");
  });

  it("grades a connection that stopped below one that never started", () => {
    expect(toneOfFlow("stale")).toBe("watch");
    expect(toneOfFlow("lost")).toBe("alarm");
  });
});

describe("saidOfFlow", () => {
  // A screen that is current has nothing to say about being current.
  it("says nothing while the connection is carrying", () => {
    expect(saidOfFlow("live")).toBeUndefined();
  });

  it.each(everyFlow.filter((flow) => flow !== "live"))(
    "tells the reader what %s means for the screen",
    (flow) => {
      const said = saidOfFlow(flow);
      expect(said?.lead).toMatch(/^[A-Z]/);
      expect(said?.prose).toMatch(/^[A-Z]/);
    },
  );

  it("says something different about each of them", () => {
    const leads = everyFlow.map((flow) => saidOfFlow(flow)?.lead);
    expect(new Set(leads).size).toBe(everyFlow.length);
  });
});

describe("toneOfTelemetry", () => {
  it.each(everyTelemetry)("gives %s a severity the interface has", (reach) => {
    expect(everyTone).toContain(toneOfTelemetry(reach));
  });

  // A machine with nothing running and one with nothing set up are each an
  // ordinary place to be, and grading either as a fault is telling an operator
  // off for a decision they made.
  it("keeps a stack that is doing what was asked of it quiet", () => {
    expect(toneOfTelemetry("live")).toBe("calm");
    expect(toneOfTelemetry("no-stack")).toBe("calm");
    expect(toneOfTelemetry("unconfigured")).toBe("calm");
  });

  it("grades some sources missing below none of them answering", () => {
    expect(toneOfTelemetry("degraded")).toBe("watch");
    expect(toneOfTelemetry("disconnected")).toBe("alarm");
  });

  it("keeps a word this build has no reading for quiet", () => {
    expect(toneOfTelemetry(unnamedTelemetry)).toBe("calm");
  });
});

describe("saidOfTelemetry", () => {
  // A screen every source answered has nothing to say about its sources.
  it("says nothing where lemonfiber read everything it was asked for", () => {
    expect(saidOfTelemetry("live")).toBeUndefined();
  });

  it.each(everyTelemetry.filter((reach) => reach !== "live"))(
    "tells the reader what %s means for the screen",
    (reach) => {
      const said = saidOfTelemetry(reach);
      expect(said?.lead).toMatch(/^[A-Za-z]/);
      expect(said?.prose).toMatch(/^[A-Z]/);
    },
  );

  it("says something different about each of them", () => {
    const leads = everyTelemetry.map((reach) => saidOfTelemetry(reach)?.lead);
    expect(new Set(leads).size).toBe(everyTelemetry.length);
  });

  // Falling off the end of the switch would hand `undefined` on as a screen
  // with nothing to say, which is what a screen reading correctly looks like.
  it("says a word this build has no reading for is one", () => {
    expect(saidOfTelemetry(unnamedTelemetry)?.lead).toBeDefined();
  });
});
