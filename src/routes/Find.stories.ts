import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Find from "./Find.svelte";
import { dune, firstPage, lastPage, nothingFound, wouldAsk } from "./found";

const answered = { kind: "answered", secondsAgo: 8 } as const;

const meta = {
  title: "Surfaces/Find",
  component: Find,
  args: {
    term: "dune",
    pages: [firstPage],
    freshness: answered,
    oninput: () => undefined,
    onsearch: () => undefined,
    onmore: () => undefined,
    onagain: () => undefined,
    onopen: () => undefined,
    onask: () => undefined,
    onrehearse: () => undefined,
    onclose: () => undefined,
  },
} satisfies Meta<typeof Find>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A search that found three titles: what asking does for them first, then each
 * title as a poster with where it stands, and a way to the next page.
 */
export const Found: Story = {};

/** Every page read, the last saying there is none after it. */
export const EveryPage: Story = { args: { pages: [firstPage, lastPage] } };

/** Before a search: what to do first, not an empty list. */
export const BeforeASearch: Story = { args: { term: "", pages: [] } };

/** The first page being read. */
export const Searching: Story = { args: { pages: [], reading: "first" } };

/** A search that found nothing, said as that. */
export const NothingFound: Story = { args: { pages: [nothingFound] } };

/** A search lemonfiber could not make, which is not one that found nothing. */
export const CouldNotSearch: Story = {
  args: {
    pages: [],
    unread: {
      at: "unanswered",
      problem: {
        kind: "unreachable",
        message: "lemonfiber is not answering. It may have been stopped.",
      },
    },
  },
};

/** A title opened over the search, with what asking for it would come to. */
export const Opened: Story = {
  args: { opened: dune, rehearsal: { at: "answered", value: wouldAsk } },
};
