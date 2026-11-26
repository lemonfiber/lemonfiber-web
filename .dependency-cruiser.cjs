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
      name: "grants-stay-with-the-operator",
      severity: "error",
      comment:
        "A plugin's grants of credentials, and revoking them, are the " +
        "operator's alone. Nothing a household member is shown may reach " +
        "what draws a grant or ends one.",
      from: { path: "^src/routes/Member\\.svelte$" },
      to: {
        reachable: true,
        path: "^src/(routes/panels/(Credentials|Granted|Revoking|Plugins|Plugging|PlugOffer)\\.svelte|lib/(credentials|revoking|revoked|plugins|plugging|plugged)\\.ts)$",
      },
    },
    {
      name: "a-running-copy-stays-with-the-operator",
      severity: "error",
      comment:
        "A backup or restore while it runs, and the word that alerts may be " +
        "missing, are the operator's alone. Nothing a household member is " +
        "shown may reach what reads or draws either.",
      from: { path: "^src/routes/Member\\.svelte$" },
      to: {
        reachable: true,
        path: "^src/(routes/(panels/(Copying|Told)\\.svelte|listening\\.svelte\\.ts)|lib/copying\\.ts)$",
      },
    },
    {
      name: "the-machines-health-stays-with-the-operator",
      severity: "error",
      comment:
        "Starting with the machine, what watches the stack from outside, the " +
        "self-healing of stuck downloads and where alerts go are the " +
        "operator's alone. Nothing a household member is shown may reach " +
        "what reads or draws them.",
      from: { path: "^src/routes/Member\\.svelte$" },
      to: {
        reachable: true,
        path: "^src/(routes/panels/Readout\\.svelte|lib/(boot|watcher|healing|notifying|readout)\\.ts)$",
      },
    },
    {
      name: "what-a-stop-interrupts-stays-with-the-operator",
      severity: "error",
      comment:
        "What a stop, an update, an uninstall, a configuration change, a " +
        "restart or a switch would interrupt is the operator's alone. Nothing " +
        "a household member is shown may reach what reads or draws it.",
      from: { path: "^src/routes/Member\\.svelte$" },
      to: {
        reachable: true,
        path: "^src/(routes/(panels/Unfinished\\.svelte|interrupting\\.svelte\\.ts)|lib/inflight\\.ts)$",
      },
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
      from: { path: "^src", pathNot: "\\.(test|testing|stories)\\.ts$" },
      // Svelte is a compiler: it is a dev dependency whose small runtime is
      // bundled into the output, so a component importing it is correct.
      to: { dependencyTypes: ["npm-dev"], pathNot: "^node_modules/svelte/" },
    },
    {
      name: "test-helpers-stay-with-the-tests",
      severity: "error",
      comment:
        "A .testing.ts module holds helpers the suites share. It may lean on " +
        "test tools and is outside the coverage gate, which holds only while " +
        "nothing that ships can reach it.",
      from: { pathNot: "\\.(test|testing|stories)\\.ts$" },
      to: { path: "\\.testing\\.ts$" },
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
