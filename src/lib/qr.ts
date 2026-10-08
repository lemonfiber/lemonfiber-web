/**
 * A scannable code for a line of text, as the squares that draw it.
 *
 * The encoder is one small package taken for this alone. It puts each
 * character's low byte into the code, so the text is first written as UTF-8
 * and handed over one byte per character: an address or a link with anything
 * outside plain ASCII in it scans as it was written rather than as its low
 * bytes. Medium error correction keeps it readable through a smudged screen
 * or a photograph at an angle, and the size is the smallest that holds the
 * text.
 */
import qrcode from "qrcode-generator";

/** The error correction every code is made with. */
export const CORRECTION = "M";

/** The modules of quiet space a reader needs around a code. */
export const QUIET = 4;

/** A code, as a square of modules and a path over the dark ones. */
export interface Drawn {
  /** How many modules wide the code is, its quiet border included. */
  readonly size: number;
  /** One path drawing every dark module, in module units. */
  readonly path: string;
}

/** The text as the encoder takes it: its UTF-8 bytes, one per character. */
function bytesOf(text: string): string {
  return Array.from(new TextEncoder().encode(text), (byte) =>
    String.fromCodePoint(byte),
  ).join("");
}

/** A scannable code for one line of text. */
export function drawn(text: string): Drawn {
  const code = qrcode(0, CORRECTION);
  code.addData(bytesOf(text), "Byte");
  code.make();
  const count = code.getModuleCount();
  const squares: string[] = [];
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (code.isDark(row, column)) {
        squares.push(
          `M${String(column + QUIET)} ${String(row + QUIET)}h1v1h-1z`,
        );
      }
    }
  }
  return { size: count + QUIET * 2, path: squares.join("") };
}
