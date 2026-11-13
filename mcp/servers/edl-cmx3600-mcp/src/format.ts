import type { FormatModule, Issue, Parsed, ParsedRecord } from "./types.js"

const TIMECODE = /^(\d{2}):(\d{2}):(\d{2}):(\d{2})$/

function timecodeToFrames(value: string, fps: number): number | null {
  const match = TIMECODE.exec(value)
  if (!match) return null
  const [, hh, mm, ss, ff] = match
  const frames = Number(ff)
  if (frames >= fps) return null
  return ((Number(hh) * 60 + Number(mm)) * 60 + Number(ss)) * fps + frames
}

function framesToSeconds(frames: number, fps: number): number {
  return Math.round((frames / fps) * 1000) / 1000
}

function parse(text: string): Parsed {
  const issues: Issue[] = []
  const records: ParsedRecord[] = []
  const meta: Parsed["meta"] = {}
  let fps = 25
  let title = ""
  let expectedEvent = 1
  let totalRecordFrames = 0

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.trim()
    if (line.length === 0) return

    const titleMatch = /^TITLE:\s*(.*)$/i.exec(line)
    if (titleMatch) {
      title = titleMatch[1].trim()
      meta.title = title
      return
    }

    const fpsMatch = /^FCM:\s*(.*)$/i.exec(line)
    if (fpsMatch) {
      const declared = fpsMatch[1].toUpperCase()
      fps = declared.includes("30") ? 30 : declared.includes("24") ? 24 : declared.includes("25") ? 25 : fps
      meta.fps = fps
      return
    }

    if (/^[A-Z]{3,4}:/.test(line)) {
      records.push({ id: `comment-${number}`, kind: "comment", fields: { key: line.split(":")[0], raw: line } })
      return
    }

    const cells = line.split(/\s+/)
    if (cells.length < 8) {
      issues.push({
        code: "short-event",
        severity: "error",
        message: `Event line needs 8 columns (num reel track trans srcIn srcOut recIn recOut), found ${cells.length}`,
        line: number,
      })
      return
    }

    const [eventText, reel, track, transition, srcIn, srcOut, recIn, recOut] = cells
    const eventNumber = Number(eventText)
    if (!Number.isInteger(eventNumber)) {
      issues.push({ code: "bad-event-number", severity: "error", message: `Event number must be an integer, got ${eventText}`, line: number })
    } else if (eventNumber !== expectedEvent) {
      issues.push({
        code: "event-sequence",
        severity: "warning",
        message: `Expected event ${String(expectedEvent).padStart(3, "0")}, found ${eventText}`,
        line: number,
      })
      expectedEvent = eventNumber
    }
    expectedEvent += 1

    for (const value of [srcIn, srcOut, recIn, recOut]) {
      if (timecodeToFrames(value, fps) === null) {
        issues.push({
          code: "bad-timecode",
          severity: "error",
          message: `Timecode ${value} is invalid at ${fps} fps (expected HH:MM:SS:FF with FF < ${fps})`,
          line: number,
        })
      }
    }

    const sourceInFrames = timecodeToFrames(srcIn, fps)
    const sourceOutFrames = timecodeToFrames(srcOut, fps)
    const recordInFrames = timecodeToFrames(recIn, fps)
    const recordOutFrames = timecodeToFrames(recOut, fps)

    if (sourceInFrames !== null && sourceOutFrames !== null && sourceOutFrames <= sourceInFrames) {
      issues.push({ code: "empty-source", severity: "error", message: "Source out must be after source in", line: number })
    }
    if (recordInFrames !== null && recordOutFrames !== null && recordOutFrames <= recordInFrames) {
      issues.push({ code: "empty-record", severity: "error", message: "Record out must be after record in", line: number })
    }

    const duration =
      recordInFrames !== null && recordOutFrames !== null ? recordOutFrames - recordInFrames : 0
    totalRecordFrames += Math.max(0, duration)

    records.push({
      id: `event-${eventText}`,
      kind: "event",
      fields: {
        event: Number.isFinite(eventNumber) ? eventNumber : 0,
        reel,
        track,
        transition,
        srcIn,
        srcOut,
        recIn,
        recOut,
        durationFrames: Math.max(0, duration),
        durationSeconds: framesToSeconds(Math.max(0, duration), fps),
      },
    })
  })

  meta.events = records.filter((record) => record.kind === "event").length
  meta.fps = fps
  meta.totalSeconds = framesToSeconds(totalRecordFrames, fps)
  if (title) meta.title = title

  return { format: "CMX3600 EDL", records, meta, issues }
}

const reference = [
  "CMX3600 edit decision list",
  "",
  "First line is usually TITLE: name.",
  "Each event line has 8 whitespace separated columns:",
  "  event reel track transition srcIn srcOut recIn recOut",
  "Event numbers start at 001 and count up.",
  "Timecode is HH:MM:SS:FF and FF must be less than the frame rate.",
  "FCM: NON-DROP FRAME declares drop frame handling.",
].join("\n")

export const format: FormatModule = {
  slug: "edl-cmx3600",
  displayName: "CMX3600 EDL",
  extensions: [".edl"],
  description: "Parse CMX3600 edit events, validate timecodes and compute durations.",
  reference,
  parse,
  sample: () =>
    [
      "TITLE: Demo Cut",
      "FCM: NON-DROP FRAME",
      "001  AX       V     C        00:00:00:00 00:00:05:00 01:00:00:00 01:00:05:00",
      "002  AX       A     C        00:00:05:00 00:00:09:00 01:00:05:00 01:00:09:00",
    ].join("\n") + "\n",
}
