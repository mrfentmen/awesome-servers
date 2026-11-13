import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "TCX file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let activities = 0
  let laps = 0
  let trackpoints = 0
  let totalTime = 0
  let totalDistance = 0
  let inLap = false

  for (const tag of tags) {
    if (tag.close) {
      if (local(tag.name) === "Lap") inLap = false
      continue
    }
    const name = local(tag.name)
    if (name === "Activity") {
      activities += 1
      const sport = tag.attrs.Sport ?? ""
      if (!sport) issues.push({ code: "activity-without-sport", severity: "warning", message: "Activity has no Sport attribute", line: tag.line })
      records.push({ id: `activity:${activities}`, kind: "activity", fields: { sport, line: tag.line } })
      continue
    }
    if (name === "Lap") {
      laps += 1
      inLap = true
      if (!tag.attrs.StartTime) issues.push({ code: "lap-without-start", severity: "warning", message: "Lap has no StartTime", line: tag.line })
      records.push({ id: `lap:${laps}`, kind: "lap", fields: { start: tag.attrs.StartTime ?? "", line: tag.line } })
      continue
    }
    if (name === "Trackpoint") {
      trackpoints += 1
      records.push({ id: `trackpoint:${trackpoints}`, kind: "trackpoint", fields: { line: tag.line } })
      continue
    }
    if (name === "TotalTimeSeconds" && inLap) {
      const value = Number(tag.attrs.value ?? "")
      void value
    }
  }

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "TotalTimeSeconds") {
      const text_ = /\d+(?:\.\d+)?/.exec(tag.attrs.value ?? "")
      void text_
    }
  }

  const values = [...text.matchAll(/<TotalTimeSeconds>([\d.]+)<\/TotalTimeSeconds>/g)].map((match) => Number(match[1]))
  totalTime = values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0)
  const distances = [...text.matchAll(/<DistanceMeters>([\d.]+)<\/DistanceMeters>/g)].map((match) => Number(match[1]))
  totalDistance = distances.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0)

  if (local(root) !== "TrainingCenterDatabase") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be TrainingCenterDatabase, found ${root || "nothing"}` })
  }
  if (activities === 0) issues.push({ code: "no-activities", severity: "error", message: "File has no Activity" })
  if (laps === 0) issues.push({ code: "no-laps", severity: "warning", message: "File has no Lap" })

  return {
    format: "TCX",
    records,
    meta: { activities, laps, trackpoints, totalTimeSeconds: Number(totalTime.toFixed(1)), totalDistanceMeters: Number(totalDistance.toFixed(1)) },
    issues,
  }
}

const reference = [
  "Garmin TCX training file",
  "",
  "<TrainingCenterDatabase>",
  "  <Activities>",
  "    <Activity Sport=\"Running\">",
  "      <Id>2026-11-12T10:00:00Z</Id>",
  "      <Lap StartTime=\"2026-11-12T10:00:00Z\">",
  "        <TotalTimeSeconds>1800</TotalTimeSeconds>",
  "        <DistanceMeters>5000</DistanceMeters>",
  "      </Lap>",
  "    </Activity>",
  "  </Activities>",
  "</TrainingCenterDatabase>",
  "",
  "Root is TrainingCenterDatabase.",
  "Each Activity needs a Sport; laps carry time and distance.",
].join("\n")

export const format: FormatModule = {
  slug: "tcx",
  displayName: "TCX",
  extensions: [".tcx"],
  description: "Parse Garmin TCX files, validate activities, laps, time and distance.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      "<TrainingCenterDatabase>",
      "  <Activities>",
      '    <Activity Sport="Running">',
      "      <Id>2026-11-12T10:00:00Z</Id>",
      '      <Lap StartTime="2026-11-12T10:00:00Z">',
      "        <TotalTimeSeconds>1800</TotalTimeSeconds>",
      "        <DistanceMeters>5000</DistanceMeters>",
      "      </Lap>",
      "    </Activity>",
      "  </Activities>",
      "</TrainingCenterDatabase>",
    ].join("\n") + "\n",
}
