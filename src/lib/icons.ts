/**
 * The drawings the interface has, and the names it calls them by.
 *
 * One 24 grid, a 1.6 stroke, rectilinear with rounded joins. The set is closed:
 * a screen draws one of these or it draws none, so the surface cannot acquire a
 * second drawing hand one screen at a time.
 *
 * A drawing carries no words, so nothing here reaches `messages/`. The word an
 * icon is announced by is given to it by whatever it sits beside.
 */

/**
 * Every drawing there is.
 *
 * `quiet` and `alert` are drawings, not states: a state's own shape lives in
 * `State`, and a tag or a log line reaches for one of these instead.
 */
export type IconName =
  | "overview"
  | "activity"
  | "storage"
  | "logs"
  | "checks"
  | "services"
  | "requests"
  | "people"
  | "setup"
  | "settings"
  | "system"
  | "chev"
  | "tick"
  | "retry"
  | "quiet"
  | "alert"
  | "info";

/**
 * Every drawing there is, in the order the type declares them.
 *
 * A screen, a story and a test all walk this one list. An eighteenth drawing
 * added to the type, to `drawings` and to here reaches all three at once,
 * rather than being left out of whichever was not remembered.
 */
export const everyIcon: readonly IconName[] = [
  "overview",
  "activity",
  "storage",
  "logs",
  "checks",
  "services",
  "requests",
  "people",
  "setup",
  "settings",
  "system",
  "chev",
  "tick",
  "retry",
  "quiet",
  "alert",
  "info",
];

/**
 * How much room a drawing takes.
 *
 * `regular` sits beside a label; `small` sits inside a tag or a table row,
 * where the words around it are smaller too.
 */
export type IconSize = "regular" | "small";

/** Every size there is, in the order they grow. */
export const everyIconSize: readonly IconSize[] = ["small", "regular"];

/**
 * One element of a drawing, placed on the 24 grid.
 *
 * A drawing is a list of these rather than a single `d`: most of the set is
 * built from more than one element, and a rounded rectangle and a circle are
 * not paths.
 */
export type Shape =
  | { readonly kind: "path"; readonly d: string }
  | {
      readonly kind: "rect";
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly rx: number;
      /** Turned about a point, for the one drawing set on a diagonal. */
      readonly transform?: string | undefined;
      /** A broken edge, for the one drawing that means nothing is arriving. */
      readonly dash?: string | undefined;
    }
  | {
      readonly kind: "circle";
      readonly cx: number;
      readonly cy: number;
      readonly r: number;
    };

/**
 * What each name draws.
 *
 * A record rather than a run of conditions: one lookup, and a name added to
 * `IconName` is a compile error here until it is drawn.
 */
export const drawings: Readonly<Record<IconName, readonly Shape[]>> = {
  overview: [
    { kind: "rect", x: 2.5, y: 4.5, width: 8, height: 6, rx: 1.5 },
    { kind: "rect", x: 13.5, y: 13.5, width: 8, height: 6, rx: 1.5 },
    { kind: "path", d: "M10.5 7.5h1.8a1.7 1.7 0 0 1 1.7 1.7v4.3" },
    { kind: "path", d: "M2.5 16.5h6" },
  ],
  activity: [
    { kind: "path", d: "M12 3.5v9.5" },
    { kind: "path", d: "M8.4 9.6 12 13.2l3.6-3.6" },
    { kind: "path", d: "M3.5 15v3.5a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V15" },
  ],
  storage: [
    { kind: "rect", x: 3, y: 4, width: 18, height: 6, rx: 1.5 },
    { kind: "rect", x: 3, y: 14, width: 18, height: 6, rx: 1.5 },
    { kind: "path", d: "M9 10v4M15 10v4" },
  ],
  logs: [
    { kind: "path", d: "M3.5 6.5h2.5M3.5 12h2.5M3.5 17.5h2.5" },
    { kind: "path", d: "M9.5 6.5h11M9.5 12h11M9.5 17.5h7" },
  ],
  checks: [
    { kind: "path", d: "M7.5 3.5h-3a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h3" },
    { kind: "path", d: "M16.5 3.5h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-3" },
    { kind: "path", d: "M8.5 12.2l2.6 2.6 4.6-5.6" },
  ],
  services: [
    { kind: "rect", x: 3, y: 3, width: 7.5, height: 7.5, rx: 1.5 },
    { kind: "rect", x: 13.5, y: 3, width: 7.5, height: 7.5, rx: 1.5 },
    { kind: "rect", x: 3, y: 13.5, width: 7.5, height: 7.5, rx: 1.5 },
    { kind: "rect", x: 13.5, y: 13.5, width: 7.5, height: 7.5, rx: 1.5 },
  ],
  requests: [
    {
      kind: "path",
      d: "M3.5 6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6.5L8 20v-4H5.5a2 2 0 0 1-2-2Z",
    },
    { kind: "path", d: "M12 7.5v5M9.5 10h5" },
  ],
  people: [
    { kind: "circle", cx: 9, cy: 8, r: 3.2 },
    {
      kind: "path",
      d: "M3 20.5v-1.2A4.8 4.8 0 0 1 7.8 14.5h2.4a4.8 4.8 0 0 1 4.8 4.8v1.2",
    },
    { kind: "path", d: "M16.2 5.4a3.2 3.2 0 0 1 0 5.2" },
    { kind: "path", d: "M17.4 14.8a4.8 4.8 0 0 1 3.6 4.5v1.2" },
  ],
  setup: [
    { kind: "path", d: "M4 20 14.5 9.5" },
    { kind: "path", d: "M12.8 7.8 16.2 11.2" },
    { kind: "path", d: "M17.5 3v3.2M21 4.8h-3.2M19.2 12.5v2.4M21.5 13.7h-2.4" },
    {
      kind: "rect",
      x: 13.6,
      y: 4.6,
      width: 5,
      height: 5,
      rx: 1.2,
      transform: "rotate(45 16.1 7.1)",
    },
  ],
  settings: [
    { kind: "path", d: "M3.5 7.5h8M15.5 7.5h5M3.5 16.5h3M10.5 16.5h10" },
    { kind: "rect", x: 11.5, y: 5, width: 5, height: 5, rx: 1.5 },
    { kind: "rect", x: 6.5, y: 14, width: 5, height: 5, rx: 1.5 },
  ],
  system: [
    { kind: "rect", x: 3, y: 3, width: 18, height: 18, rx: 2 },
    { kind: "path", d: "M3 9.5h18M9.5 9.5V21" },
  ],
  chev: [{ kind: "path", d: "M7 10l5 5 5-5" }],
  tick: [{ kind: "path", d: "M5 12.5l4.5 4.5L19 7" }],
  retry: [
    { kind: "path", d: "M20 5.5v5h-5" },
    { kind: "path", d: "M19.4 10.5a8 8 0 1 0-.9 6.4" },
  ],
  quiet: [
    { kind: "rect", x: 3, y: 5, width: 18, height: 14, rx: 2, dash: "3 3" },
    { kind: "path", d: "M9.5 12h5" },
  ],
  alert: [
    { kind: "path", d: "M12 4.8 20.6 19.2H3.4Z" },
    { kind: "path", d: "M12 10.2v4M12 16.8v.1" },
  ],
  info: [
    { kind: "circle", cx: 12, cy: 12, r: 8.5 },
    { kind: "path", d: "M12 11v5M12 8.2v.1" },
  ],
};
