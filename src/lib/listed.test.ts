import { describe, expect, it } from "vitest";
import { listed } from "./listed";

describe("names, as a reader is given them", () => {
  it("keeps their order, apart by a comma", () => {
    expect(listed(["sonarr", "radarr", "lidarr"])).toBe(
      "sonarr, radarr, lidarr",
    );
  });

  it("gives one name as it is, and none as nothing", () => {
    expect(listed(["sonarr"])).toBe("sonarr");
    expect(listed([])).toBe("");
  });
});
