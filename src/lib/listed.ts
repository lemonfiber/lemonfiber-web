/**
 * Names, as a reader is given a list of them: in the order they came, apart
 * by a comma.
 */
export function listed(names: readonly string[]): string {
  return names.join(", ");
}
