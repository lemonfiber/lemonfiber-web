# Task runner for lemonfiber/lemonfiber-web. `just` with no argument lists these.
#
# npm is where the steps are — `package.json` holds them and CI runs them there.
# What this file adds is a place to say what the one command covers, which
# `package.json` has no slot for and npm prints nowhere.
#
# The recipes, and what each covers.
default:
    @just --list

# Turn on the repository's own git hooks. Once per clone.
#
# `npm ci` does this too, through npm's `prepare` script, and that is the usual
# route here. This is the same line under a name, for a clone where nothing has
# been installed yet — `core.hooksPath` is per-clone local config and no commit
# can carry it.
#
# Turn on this clone's git hooks. Once per clone.
hooks:
    git config core.hooksPath .githooks
    @echo "hooks on: .githooks/commit-msg, .githooks/pre-push"

# The two things `gate.yml` does before it runs the gate, and neither is in
# `npm run ci`: the SDK this surface is drawn through has to be built, and the
# browser the accessibility sweep drives has to be installed. On a clone where
# neither has happened, `npm run ci` reaches `a11y` and fails there.
#
# Once per clone, and again whenever the SDK moves.
#
# What `gate.yml` installs and builds before the gate.
ready:
    npm run client
    ./node_modules/.bin/playwright install --with-deps chromium

# Everything the `gate` job runs, which is `npm run ci` — after `ready` above.
#
# It is not the whole of CI. These are not here, and none of them can be:
#
#   commitlint, dco, attribution,   `.githooks/commit-msg` refuses all four
#   the citation gate               before the push, and `hooks` turns it on
#   sdk-drift                       compares this surface against the SDK's
#                                   published contract; needs the forge
#   hygiene                         actionlint, typos, links, markdown, the
#                                   invite check and shared-files — the last
#                                   needs a spec checkout
#   workflow-pins                   asks the forge which commits a pin has not
#                                   taken
#   CodeQL, gitleaks, osv-scanner,  forge-side
#   sonar, sonar-gate, label,
#   goals, the reference comment
#
# Everything the `gate` job runs — not the whole of CI.
ci: hooks ready
    npm run ci
