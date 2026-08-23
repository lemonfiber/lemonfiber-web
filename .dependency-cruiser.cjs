/**
 * Architecture rules, in the spirit of the Rust workspace's own.
 *
 * Each one exists because the opposite is easy to do by accident and hard to
 * see in review.
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "A cycle means neither module can be understood on its own.",
      from: {},
      to: { circular: true },
    },
    {
      name: "vocabulary-knows-nothing-of-rendering",
      severity: "error",
      comment:
        "src/lib is the vocabulary the interface speaks; components render it. " +
        "A dependency the other way makes the words depend on their presentation.",
      from: { path: "^src/lib" },
      to: { path: "^src/(components|routes)" },
    },
    {
      name: "nothing-reaches-past-the-sdk",
      severity: "error",
      comment:
        "The surface talks to lemonfiber through @lemonfiber/sdk-ts and nothing " +
        "else. A direct fetch would be transport this repo does not own.",
      from: { path: "^src" },
      to: { path: "node_modules/(node-fetch|axios|undici|superagent)" },
    },
    {
      name: "no-orphans",
      severity: "error",
      comment: "A module nothing imports is either dead or wired up wrong.",
      from: {
        orphan: true,
        pathNot: [
          "\\.d\\.ts$",
          "\\.(test|stories)\\.ts$",
          "^src/main\\.ts$",
          "^src/app\\.css$",
        ],
      },
      to: {},
    },
    {
      name: "no-dev-dep-in-what-ships",
      severity: "error",
      comment: "Something that ships must not lean on a tool that does not.",
      from: { path: "^src", pathNot: "\\.(test|stories)\\.ts$" },
      // Svelte is a compiler: it is a dev dependency whose small runtime is
      // bundled into the output, so a component importing it is correct.
      to: { dependencyTypes: ["npm-dev"], pathNot: "^node_modules/svelte/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "^(coverage|dist|storybook-static|src/paraglide)" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "browser", "svelte"],
      extensions: [".ts", ".js", ".svelte"],
    },
  },
};
