export class ChordError extends Error {}

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const ALIAS: Record<string, string> = { Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", "Cb": "B", "F#": "F#", "E#": "F" }

const CHORDS: Record<string, number[]> = {
  maj: [0, 4, 7], min: [0, 3, 7], "7": [0, 4, 7, 10], maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10],
  dim: [0, 3, 6], aug: [0, 4, 8], sus2: [0, 2, 7], sus4: [0, 5, 7], "6": [0, 4, 7, 9], min6: [0, 3, 7, 9],
}
const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10], harmonic_minor: [0, 2, 3, 5, 7, 8, 11], pentatonic: [0, 2, 4, 7, 9],
}

function rootIndex(root: string): number {
  const r = ALIAS[root] ?? root
  const i = NOTES.indexOf(r)
  if (i < 0) throw new ChordError(`Unknown root note ${root}`)
  return i
}

export async function chordNotes(args: { root?: string; chord?: string }): Promise<string> {
  const root = (args.root ?? "").trim()
  if (!root) throw new ChordError("Provide a root note like C or F#")
  const type = (args.chord ?? "maj").toLowerCase()
  const intervals = CHORDS[type]
  if (!intervals) throw new ChordError(`Unknown chord type ${type}. Use ${Object.keys(CHORDS).join(", ")}`)
  const r = rootIndex(root)
  const notes = intervals.map((iv) => NOTES[(r + iv) % 12])
  return `${root}${type === "maj" ? "" : type}: ${notes.join(" - ")}`
}

export async function scaleNotes(args: { root?: string; scale?: string }): Promise<string> {
  const root = (args.root ?? "").trim()
  if (!root) throw new ChordError("Provide a root note")
  const scale = (args.scale ?? "major").toLowerCase()
  const intervals = SCALES[scale]
  if (!intervals) throw new ChordError(`Unknown scale ${scale}. Use ${Object.keys(SCALES).join(", ")}`)
  const r = rootIndex(root)
  const notes = intervals.map((iv) => NOTES[(r + iv) % 12])
  return `${root} ${scale}: ${notes.join(" - ")}`
}

// ---- muxA tools:

const INTERVAL_NAMES = [
  "unison", "minor 2nd", "major 2nd", "minor 3rd", "major 3rd", "perfect 4th",
  "tritone", "perfect 5th", "minor 6th", "major 6th", "minor 7th", "major 7th",
  "octave",
]

// The 17 standard key signatures, by tonic spelling. A key signature is really
// a position on the circle of fifths, so a key is stored as a signed accidental
// count: positive is sharps, negative is flats.
const MAJOR_SHARPS_BY_NAME: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7, "D#": 9, "A#": 10,
  F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6,
}

// Same thing indexed by pitch class, for tonics the name table does not cover.
const MAJOR_SHARPS_BY_CLASS: Record<number, number> = {
  5: -1, 0: 0, 7: 1, 2: 2, 9: 3, 4: 4, 11: 5, 6: 6, 1: 7, 8: 8, 3: 9, 10: 10,
}

const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"]
const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"]

function sharpsForMajor(root: string, pitchClass: number): number {
  const named = MAJOR_SHARPS_BY_NAME[root]
  if (named !== undefined) return named
  const byClass = MAJOR_SHARPS_BY_CLASS[pitchClass]
  // Beyond the standard signatures the count keeps climbing by fifths; say so
  // rather than inventing a signature nobody uses.
  if (byClass === undefined) {
    throw new ChordError(`No standard key signature for ${root}. Try a tonic like C#, F# or Bb.`)
  }
  return byClass
}

function accidentals(count: number): string {
  if (count === 0) return "none"
  const order = count > 0 ? SHARP_ORDER : FLAT_ORDER
  return order.slice(0, Math.abs(count)).map((n) => `${n}${count > 0 ? "#" : "b"}`).join(" ")
}

function spell(index: number): string {
  return NOTES[((index % 12) + 12) % 12]
}

