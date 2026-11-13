import { parseCif } from "./_cif-core.js"
import type { FormatModule } from "./types.js"

const reference = [
  "CIF crystallographic information file",
  "",
  "data_<name> starts a block.",
  "_tag value sets a single item.",
  "loop_ followed by several _tag lines then rows of values.",
  "# ends a loop and starts a comment.",
  "Text fields start with a semicolon in column one and end the same way.",
  "Values with spaces are quoted in single quotes.",
].join("\n")

export const format: FormatModule = {
  slug: "cif",
  displayName: "CIF",
  extensions: [".cif"],
  description: "Parse CIF crystal data blocks, tags and loops.",
  reference,
  parse: (text) => parseCif(text, "CIF"),
  sample: () =>
    [
      "data_demo",
      "_cell_length_a 5.431",
      "_cell_length_b 5.431",
      "_cell_length_c 5.431",
      "loop_",
      "_atom_site_label",
      "_atom_site_type_symbol",
      "_atom_site_fract_x",
      "_atom_site_fract_y",
      "Si1 Si 0.0 0.0",
      "Si2 Si 0.25 0.25",
      "#",
    ].join("\n") + "\n",
}
