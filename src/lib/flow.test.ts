import { describe, expect, it } from "vitest";
import { everyFlow, saidOfFlow, toneOfFlow } from "./flow";
import { everyTone } from "./state";

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
