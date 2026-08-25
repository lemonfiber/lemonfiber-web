/**
 * The one sentence a reply carried, whatever shape it carried it in.
 *
 * lemonfiber says no in two ways. A request this surface would not carry out is
 * answered as prose, and a command that ran and failed is answered as the
 * problem envelope every other endpoint renders. Both reach a reader as one
 * plain sentence, and which of the two arrived is not something a reader should
 * have to know.
 *
 * The envelope is tried first: its summary is that sentence already written,
 * and the raw document is not something to show anyone. A body carrying neither
 * leaves nothing of lemonfiber's to pass on.
 */
import { isKind, malformed, parse } from "@lemonfiber/sdk-ts";

/**
 * What lemonfiber said, in the words it said it in.
 */
export function saidIn(said: string): string {
  const read = parse<unknown>(said);
  if (read.ok && isKind(read.value, "error")) return read.value.data.summary;
  return said.trim() === "" ? malformed().message : said;
}
