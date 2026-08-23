<script lang="ts">
  import type { Snippet } from "svelte";
  import Value from "./Value.svelte";
  import type { Cell, Column, Emphasis, Row } from "../lib/table";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What the table is a table of; the name it is announced by. */
    label: string;
    /** The columns, in the order they are shown. */
    columns: readonly Column[];
    /** The rows, in the order they are shown. */
    rows: readonly Row[];
  }

  let { label, columns, rows }: Props = $props();

  /** What one cell holds, flattened to what the table draws for it. */
  interface Held {
    /** How much ink its words take. */
    readonly ink: Emphasis;
    /** What it says, where it says words. */
    readonly text: string | undefined;
    /** The phrase qualifying them. */
    readonly caption: string | undefined;
    /** Whether that phrase takes a line of its own. */
    readonly below: boolean;
    /** What it draws, where it draws something. */
    readonly draw: Snippet | undefined;
  }

  /** One cell of one row: the column it sits in, and what it holds. */
  interface Laid extends Held {
    readonly column: Column;
  }

  /** One row: what it says, or what has stopped saying anything. */
  interface Line {
    readonly key: string;
    /** What has gone silent, where this row's source has. */
    readonly silent: string | undefined;
    /** Its cells, in column order. None, where its source is silent. */
    readonly cells: readonly Laid[];
  }

  const empty: Held = {
    ink: "plain",
    text: undefined,
    caption: undefined,
    below: false,
    draw: undefined,
  };

  /** What a cell holds. A column a row gives no cell for holds nothing. */
  function held(cell: Cell | undefined): Held {
    if (cell === undefined) return empty;
    if (cell.kind === "drawn") return { ...empty, draw: cell.draw };
    return {
      ink: cell.emphasis ?? "plain",
      text: cell.text,
      caption: cell.caption,
      below: cell.below === true,
      draw: undefined,
    };
  }

  const headed = $derived(columns.some((column) => column.head !== undefined));
  const rest = $derived(columns.length - 1);
  const notAnswering = m.table_row_silent();

  const lines: readonly Line[] = $derived(
    rows.map((row) =>
      row.kind === "silent"
        ? { key: row.key, silent: row.name, cells: [] }
        : {
            key: row.key,
            silent: undefined,
            cells: columns.map((column, index) => ({
              column,
              ...held(row.cells[index]),
            })),
          },
    ),
  );
</script>

<!--
  The columns are data and the cells are not, which is the only split the six
  tables on this surface allow. Alignment, the figure face, the heading row and
  the width of the control strip belong to the column, so a speed lands under
  the speed heading in every table rather than in whichever cell remembered its
  class. What a cell holds is a bar, a tag, a figure or a button in five of the
  six, so a cell takes a snippet and the table never learns which of them.

  A row whose source has stopped answering is a kind of row, not a cell a
  screen improvises: it keeps its name, blanks the columns it can no longer
  stand behind, and says so in the same words every table uses. Those words are
  set as an absent figure, which is how every other absence here reads.

  A row shorter than the table keeps each column's place rather than sliding
  its later cells left, so a figure is never read under the wrong heading.

  The table is named by a caption rather than by the panel around it: a reader
  who lands inside the table is told what it is a table of.
-->
<div class="tbl-wrap">
  <table>
    <caption class="name">{label}</caption>
    <colgroup>
      {#each columns as column, index (index)}
        <col style:width={column.width} />
      {/each}
    </colgroup>
    {#if headed}
      <thead>
        <tr>
          {#each columns as column, index (index)}
            <th
              scope="col"
              class:end={column.kind === "figure" || column.kind === "control"}
            >
              {#if column.head !== undefined}
                <span class="word">{column.head}</span>
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
    {/if}
    <tbody>
      {#each lines as line (line.key)}
        <tr>
          {#if line.silent !== undefined}
            <td class="quiet"><span class="word">{line.silent}</span></td>
            <td colspan={rest}>
              <Value state="unknown" absent={notAnswering} />
            </td>
          {:else}
            {#each line.cells as laid, index (index)}
              <td
                class:end={laid.column.kind === "figure" ||
                  laid.column.kind === "control"}
                class:figure={laid.column.kind === "figure"}
                class:control={laid.column.kind === "control"}
                class:quiet={laid.ink === "quiet"}
                class:lead={laid.ink === "lead"}
                class:alarm={laid.ink === "alarm"}
              >
                {#if laid.text !== undefined}
                  <span class="word">{laid.text}</span>
                {/if}
                {#if laid.caption !== undefined}
                  <span class="caption" class:below={laid.below}
                    >{laid.caption}</span
                  >
                {/if}
                {#if laid.draw !== undefined}
                  {@render laid.draw()}
                {/if}
              </td>
            {/each}
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  /* A wide table scrolls inside its own border rather than taking the page
     sideways with it. */
  .tbl-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-prose);
  }

  /* Read, never seen: the panel's heading is what a sighted reader gets. */
  .name {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  th {
    padding: var(--sp-2) var(--panel-pad);
    border-bottom: 1px solid var(--line);
    background: var(--pith);
    text-align: left;
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--faint);
    white-space: nowrap;
  }

  td {
    padding: 0 var(--panel-pad);
    height: var(--row-h);
    border-bottom: 1px solid var(--line-soft);
  }

  /* The panel's own border closes the table. */
  tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover td {
    background: var(--pith);
  }

  .end {
    text-align: right;
  }

  td.figure {
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  /* As narrow as what it holds, so the columns before it keep the width. */
  td.control {
    width: 1%;
    white-space: nowrap;
  }

  td.quiet,
  .caption {
    font-size: var(--text-note);
    color: var(--faint);
  }

  td.lead {
    font-weight: 600;
  }

  td.alarm {
    color: var(--alarm);
  }

  .below {
    display: block;
  }
</style>
