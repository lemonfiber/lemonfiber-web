import qrcode from "qrcode-generator";
import { describe, expect, it } from "vitest";
import { CORRECTION, drawn, QUIET } from "./qr";

/** Every dark module a path draws, as `column,row` in code units. */
function darkIn(path: string): Set<string> {
  const found = new Set<string>();
  for (const [, column, row] of path.matchAll(/M(\d+) (\d+)/g)) {
    found.add(
      `${String(Number(column) - QUIET)},${String(Number(row) - QUIET)}`,
    );
  }
  return found;
}

describe("a scannable code", () => {
  it("draws exactly the modules the encoder sets, inside a quiet border", () => {
    const text = "jellyfin://192.0.2.10:8096";
    const expected = qrcode(0, CORRECTION);
    expected.addData(text, "Byte");
    expected.make();
    const count = expected.getModuleCount();

    const code = drawn(text);
    expect(code.size).toBe(count + QUIET * 2);
    const dark = darkIn(code.path);
    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        expect(dark.has(`${String(column)},${String(row)}`)).toBe(
          expected.isDark(row, column),
        );
      }
    }
  });

  it("writes text outside ASCII as its UTF-8 bytes", () => {
    const text = "jellyfin://médias.lan/ünd";
    const bytes = Array.from(new TextEncoder().encode(text), (byte) =>
      String.fromCodePoint(byte),
    ).join("");
    const expected = qrcode(0, CORRECTION);
    expected.addData(bytes, "Byte");
    expected.make();
    expect(drawn(text).size).toBe(expected.getModuleCount() + QUIET * 2);
  });
});
