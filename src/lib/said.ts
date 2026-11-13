/**
 * Whether lemonfiber said something in a field it may leave out.
 *
 * A field left out, written as null or left empty says nothing, and a line
 * built from it would say nothing either.
 */

/** A value lemonfiber may leave out, kept where it says something. */
export function said(value: string | null | undefined): value is string {
  return value !== undefined && value !== null && value !== "";
}
