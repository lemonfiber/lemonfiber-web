/**
 * The plugins on a machine, as a suite stands them in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Installed, Plugins } from "../lib/plugins";

/** A subtitle fetcher from a git source, signed, filling one capability. */
export const subtitles: Installed = {
  plugin: "subtitle-fetch",
  name: "Subtitle fetch",
  description: "Fetches subtitles for everything the library holds.",
  version: "1.4.0",
  from: "example.org/subtitle-fetch.git",
  revision: "9f2c1e7",
  signed: "lemonfiber catalogue key SHA256:4kQ2",
  installed_at: "1790000000",
  services: [
    {
      service: "subfetch",
      image: "ghcr.io/example/subfetch",
      tag: "1.4.0",
      digest: "sha256:3b1f",
      config_path: "plugins/subtitle-fetch/subfetch",
      takes_data: true,
    },
  ],
  provides: ["subtitles"],
};

/**
 * A plugin put on from a directory before its record kept a name, a source or
 * a stamp, running nothing of its own and filling nothing.
 */
export const bare: Installed = {
  plugin: "hand-rolled",
  name: null,
  version: "0.1.0",
  from: "",
  installed_at: "",
  services: [],
};

/** Two plugins, one source asked, one choice made in a plugin's favour. */
export const plugins: Plugins = {
  installed: [subtitles, bare],
  rehearsed: false,
  sources: [
    {
      plugin: "subtitle-fetch",
      from: "example.org/subtitle-fetch.git",
      standing: { standing: "reachable" },
    },
  ],
  substituted: [
    { capability: "subtitles", service: "subfetch", plugin: "subtitle-fetch" },
  ],
};
