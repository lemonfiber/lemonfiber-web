import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import DataTable from "./DataTable.svelte";
import {
  everyColumnKind,
  everyEmphasis,
  type Column,
  type Row,
} from "../lib/table";

const review = createRawSnippet(() => ({
  render: () => `<button type="button">Review</button>`,
}));

const columns: readonly Column[] = [
  { head: "What", width: "44%" },
  { head: "Why it's here" },
  { head: "Size", kind: "figure" },
  { kind: "control" },
];

const rows: readonly Row[] = [
  {
    kind: "answered",
    key: "tour",
    cells: [
      { kind: "words", text: "The Grand Tour", caption: "— all 5 series" },
      {
        kind: "words",
        text: "Nobody has watched it in a year",
        emphasis: "quiet",
      },
      { kind: "words", text: "318 GB" },
      { kind: "drawn", draw: review },
    ],
  },
  {
    kind: "answered",
    key: "dune",
    cells: [
      { kind: "words", text: "Dune: Part One", caption: "— 4K and 1080p" },
      {
        kind: "words",
        text: "You have it twice, in two qualities",
        emphasis: "quiet",
      },
      { kind: "words", text: "94 GB" },
      { kind: "drawn", draw: review },
    ],
  },
];

const table = { label: "Biggest things you could remove", columns, rows };

/** What a node reads as, with the template's own whitespace collapsed. */
const tidy = (text: string | null | undefined): string =>
  String(text).replace(/\s+/g, " ").trim();

const cellsIn = (container: Element, row: number): Element[] => [
  ...(container.querySelectorAll("tbody tr")[row]?.querySelectorAll("td") ??
    []),
];

const cellsOf = (container: Element, row: number): string[] =>
  cellsIn(container, row).map((cell) => tidy(cell.textContent));

describe("DataTable", () => {
  it("gives the table a name to be announced by", () => {
    render(DataTable, table);
    expect(
      screen.getByRole("table", { name: "Biggest things you could remove" }),
    ).toBeInTheDocument();
  });

  it("heads each column that has a heading", () => {
    render(DataTable, table);
    for (const head of ["What", "Why it's here", "Size"]) {
      expect(screen.getByRole("columnheader", { name: head })).toBeVisible();
    }
  });

  it("keeps the place of a column the design gives no heading", () => {
    render(DataTable, table);
    const heads = screen.getAllByRole("columnheader");
    expect(heads).toHaveLength(columns.length);
    expect(tidy(heads[3]?.textContent)).toBe("");
  });

  it("ties every heading to the column under it", () => {
    render(DataTable, table);
    for (const head of screen.getAllByRole("columnheader")) {
      expect(head).toHaveAttribute("scope", "col");
    }
  });

  it("says what each cell says", () => {
    const { container } = render(DataTable, table);
    expect(cellsOf(container, 0)).toEqual([
      "The Grand Tour — all 5 series",
      "Nobody has watched it in a year",
      "318 GB",
      "Review",
    ]);
  });

  it("puts what a cell was given to draw inside that cell", () => {
    render(DataTable, table);
    expect(screen.getAllByRole("button", { name: "Review" })).toHaveLength(2);
  });

  it("keeps the table inside a wrapper of its own to scroll in", () => {
    const { container } = render(DataTable, table);
    expect(container.querySelector(".tbl-wrap > table")).toBe(
      screen.getByRole("table", { name: "Biggest things you could remove" }),
    );
  });

  it("fixes the width of a column the design fixes", () => {
    const { container } = render(DataTable, table);
    const widths = [...container.querySelectorAll("col")].map((one) =>
      one.getAttribute("style"),
    );
    expect(widths[0]).toContain("44%");
    expect(widths[1]).toBeNull();
  });
});

describe("a table the design gives no headings", () => {
  it("shows no heading row at all", () => {
    render(DataTable, {
      label: "Downloading now",
      columns: [{ width: "44%" }, { kind: "figure" }],
      rows: [
        {
          kind: "answered",
          key: "ubuntu",
          cells: [
            {
              kind: "words",
              text: "Ubuntu 24.04.1 LTS",
              caption: "from a torrent",
              below: true,
            },
            { kind: "words", text: "4.1 MB/s" },
          ],
        },
      ],
    });
    expect(screen.queryAllByRole("columnheader")).toHaveLength(0);
    expect(
      screen.getByRole("table", { name: "Downloading now" }),
    ).toBeVisible();
  });

  it("still sets the caption under the text where the design stacks it", () => {
    const { container } = render(DataTable, {
      label: "Downloading now",
      columns: [{ width: "44%" }],
      rows: [
        {
          kind: "answered",
          key: "ubuntu",
          cells: [
            {
              kind: "words",
              text: "Ubuntu 24.04.1 LTS",
              caption: "from a torrent",
              below: true,
            },
          ],
        },
      ],
    });
    expect(container.querySelector(".caption")).toHaveClass("below");
  });

  it("sets a caption beside the text where the design does not", () => {
    const { container } = render(DataTable, table);
    expect(container.querySelector(".caption")).not.toHaveClass("below");
  });
});

describe("the way a column sets its cells", () => {
  it.each(everyColumnKind)("reads a %s column its own way", (kind) => {
    const { container } = render(DataTable, {
      label: "Waiting in line",
      columns: [{ head: "Waiting", kind }],
      rows: [
        {
          kind: "answered",
          key: "sonarr",
          cells: [{ kind: "words", text: "12" }],
        },
      ],
    });
    const cell = container.querySelector("tbody td");
    expect(cell?.classList.contains("end")).toBe(kind !== "words");
    expect(cell?.classList.contains("figure")).toBe(kind === "figure");
    expect(cell?.classList.contains("control")).toBe(kind === "control");
  });

  it("aligns a heading with the column under it", () => {
    render(DataTable, table);
    expect(screen.getByRole("columnheader", { name: "Size" })).toHaveClass(
      "end",
    );
    expect(screen.getByRole("columnheader", { name: "What" })).not.toHaveClass(
      "end",
    );
  });

  it("keeps a column's place where a row gives it no cell", () => {
    const { container } = render(DataTable, {
      ...table,
      rows: [
        {
          kind: "answered",
          key: "short",
          cells: [{ kind: "words", text: "Failed downloads" }],
        },
      ],
    });
    expect(cellsOf(container, 0)).toEqual(["Failed downloads", "", "", ""]);
  });
});

describe("how much ink a cell's words take", () => {
  it.each(everyEmphasis)("sets a %s cell in its own ink", (emphasis) => {
    const { container } = render(DataTable, {
      label: "Waiting in line",
      columns: [{ head: "Stuck" }],
      rows: [
        {
          kind: "answered",
          key: "sonarr",
          cells: [{ kind: "words", text: "1", emphasis }],
        },
      ],
    });
    const cell = container.querySelector("tbody td");
    expect(cell?.classList.contains("quiet")).toBe(emphasis === "quiet");
    expect(cell?.classList.contains("lead")).toBe(emphasis === "lead");
    expect(cell?.classList.contains("alarm")).toBe(emphasis === "alarm");
  });

  it("leaves a drawn cell to bring its own", () => {
    const { container } = render(DataTable, {
      label: "Biggest things you could remove",
      columns: [{ kind: "control" }],
      rows: [
        {
          kind: "answered",
          key: "tour",
          cells: [{ kind: "drawn", draw: review }],
        },
      ],
    });
    const cell = container.querySelector("tbody td");
    expect(cell?.classList.contains("quiet")).toBe(false);
    expect(cell?.classList.contains("lead")).toBe(false);
    expect(cell?.classList.contains("alarm")).toBe(false);
  });
});

describe("a row whose source has stopped answering", () => {
  const waiting = {
    label: "Waiting in line",
    columns: [
      { head: "Program" },
      { head: "Waiting", kind: "figure" },
      { head: "Stuck", kind: "figure" },
      { head: "What that means" },
    ] as readonly Column[],
    rows: [
      {
        kind: "answered",
        key: "sonarr",
        cells: [
          { kind: "words", text: "sonarr", caption: "— your series" },
          { kind: "words", text: "12" },
          { kind: "words", text: "1", emphasis: "alarm" },
          {
            kind: "words",
            text: "tried twice, then gave up",
            emphasis: "alarm",
          },
        ],
      },
      { kind: "silent", key: "prowlarr", name: "prowlarr" },
    ] as readonly Row[],
  };

  it("keeps the name of what has gone silent", () => {
    render(DataTable, waiting);
    expect(screen.getByText("prowlarr")).toBeInTheDocument();
  });

  it("says so in place of the figures it can no longer stand behind", () => {
    render(DataTable, waiting);
    expect(
      screen.getByText("isn't answering — this row only"),
    ).toBeInTheDocument();
  });

  it("blanks every column but the one naming it", () => {
    const { container } = render(DataTable, waiting);
    const cells = cellsIn(container, 1);
    expect(cells).toHaveLength(2);
    expect(cells[1]).toHaveAttribute("colspan", "3");
  });

  it("sets the words as an absence, never as a figure", () => {
    const { container } = render(DataTable, waiting);
    expect(container.querySelector("tbody tr:last-child em")).toHaveTextContent(
      "isn't answering — this row only",
    );
  });

  it("leaves the rows that did answer standing", () => {
    const { container } = render(DataTable, waiting);
    expect(cellsOf(container, 0)).toEqual([
      "sonarr — your series",
      "12",
      "1",
      "tried twice, then gave up",
    ]);
  });
});

describe("when the rows change under a table already on screen", () => {
  it("follows the figures and the trust behind them together", async () => {
    const { container, rerender } = render(DataTable, table);
    expect(cellsOf(container, 0)[2]).toBe("318 GB");
    expect(screen.queryByText("isn't answering — this row only")).toBeNull();

    await rerender({
      rows: [
        { kind: "silent", key: "prowlarr", name: "prowlarr" },
      ] as readonly Row[],
    });

    expect(
      screen.getByText("isn't answering — this row only"),
    ).toBeInTheDocument();
    expect(screen.queryByText("318 GB")).toBeNull();
  });
});
