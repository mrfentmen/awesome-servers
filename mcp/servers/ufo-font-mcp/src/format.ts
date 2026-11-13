import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { scanTags, validateXml } from "./_xml.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  validateXml(text, "glyph", "UFO glyph", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const glyph = tags.find((tag) => tag.name === "glyph")
  const advance = tags.find((tag) => tag.name === "advance")
  const unicode = tags.find((tag) => tag.name === "unicode")
  const contours = tags.filter((tag) => tag.name === "contour" && !tag.close).length
  const components = tags.filter((tag) => tag.name === "component" && !tag.close)

  if (glyph && !glyph.attrs.name) {
    issues.push({ code: "missing-name", severity: "error", message: "glyph element has no name attribute", line: glyph.line })
  }
  if (advance && !Number.isFinite(Number(advance.attrs.width))) {
    issues.push({ code: "bad-advance", severity: "error", message: `advance width is not a number: ${advance.attrs.width}`, line: advance.line })
  }

  let points = 0
  for (const tag of tags) {
    if (tag.name !== "point" || tag.close) continue
    points += 1
    const x = Number(tag.attrs.x)
    const y = Number(tag.attrs.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      issues.push({ code: "bad-point", severity: "error", message: "point needs numeric x and y", line: tag.line })
    }
    records.push({
      id: `point:${points}`,
      kind: "point",
      fields: { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0, type: tag.attrs.type ?? "", smooth: tag.attrs.smooth === "yes" },
    })
  }

  for (const tag of components) {
    if (!tag.attrs.base) {
      issues.push({ code: "component-without-base", severity: "error", message: "component needs a base attribute", line: tag.line })
    }
    records.push({ id: `component:${tag.attrs.base ?? "?"}`, kind: "component", fields: { base: tag.attrs.base ?? "" } })
  }

  if (glyph) {
    records.unshift({
      id: `glyph:${glyph.attrs.name ?? "?"}`,
      kind: "glyph",
      fields: {
        name: glyph.attrs.name ?? "",
        format: glyph.attrs.format ?? "",
        unicode: unicode?.attrs.hex ?? "",
        advanceWidth: advance ? Number(advance.attrs.width) : null,
      },
    })
  }
  if (contours === 0 && components.length === 0) {
    issues.push({ code: "empty-outline", severity: "warning", message: "Glyph has no contours and no components" })
  }

  return {
    format: "UFO glyph",
    records,
    meta: {
      glyph: glyph?.attrs.name ?? "",
      format: glyph?.attrs.format ?? "",
      unicode: unicode?.attrs.hex ?? "",
      advanceWidth: advance ? Number(advance.attrs.width) : 0,
      contours,
      components: components.length,
      points,
    },
    issues,
  }
}

const reference = [
  "UFO glyph (.glif) file",
  "",
  "<glyph name=\"A\" format=\"2\"> is the root.",
  "<advance width=\"600\"/> sets the advance width.",
  "<unicode hex=\"0041\"/> records the code point.",
  "<outline> holds <contour> blocks of <point x= y= type=>.",
  "<component base=\"B\" xOffset= yOffset=/> references another glyph.",
  "Point types: move, line, curve, qcurve, offcurve.",
].join("\n")

export const format: FormatModule = {
  slug: "ufo-font",
  displayName: "UFO glyph",
  extensions: [".glif"],
  description: "Parse UFO glyph files, contours, points and components.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<glyph name="A" format="2">',
      '  <advance width="600"/>',
      '  <unicode hex="0041"/>',
      "  <outline>",
      "    <contour>",
      '      <point x="0" y="0" type="line"/>',
      '      <point x="300" y="700" type="line"/>',
      "    </contour>",
      "  </outline>",
      "</glyph>",
    ].join("\n") + "\n",
}
