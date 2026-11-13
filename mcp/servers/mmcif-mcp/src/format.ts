import { parseCif } from "./_cif-core.js"
import type { FormatModule, Parsed } from "./types.js"

function parse(text: string): Parsed {
  const parsed = parseCif(text, "mmCIF")
  const categories = new Set<string>()
  for (const record of parsed.records) {
    const tag = Object.keys(record.fields).find((key) => key.startsWith("_"))
    if (tag) categories.add(tag.split(".")[0])
  }
  parsed.meta.categories = categories.size
  parsed.meta.atomSites = parsed.records.filter((record) => /atom_site/i.test(record.kind)).length
  if (parsed.meta.atomSites === 0) {
    parsed.issues.push({
      code: "no-atom-site",
      severity: "warning",
      message: "No _atom_site category found; this is not a coordinate mmCIF",
    })
  }
  return parsed
}

const reference = [
  "mmCIF macromolecular CIF",
  "",
  "Same syntax as CIF: data_<id>, _category.item value, loop_ blocks.",
  "Tags are dotted: _atom_site.Cartn_x, _entity.pdbx_description.",
  "The first part of the tag is the category and groups related items.",
  "Coordinate files carry an _atom_site loop with one row per atom.",
  "Quoted values and semicolon text blocks are the same as CIF.",
].join("\n")

export const format: FormatModule = {
  slug: "mmcif",
  displayName: "mmCIF",
  extensions: [".cif", ".mmcif"],
  description: "Parse mmCIF categories and atom site loops.",
  reference,
  parse,
  sample: () =>
    [
      "data_1ABC",
      "_audit_conform.dict_name mmcif_pdbx.dic",
      "loop_",
      "_atom_site.group_PDB",
      "_atom_site.id",
      "_atom_site.type_symbol",
      "_atom_site.Cartn_x",
      "ATOM 1 C 0.0",
      "ATOM 2 N 1.5",
      "#",
    ].join("\n") + "\n",
}
