export class MidiError extends Error {}

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const A4 = 440

export async function noteName(args: { midi?: number }): Promise<string> {
  const m = Math.round(args.midi ?? -1)
  if (m < 0 || m > 127) throw new MidiError("MIDI note must be 0 to 127")
  return `${m}: ${NAMES[m % 12]}${Math.floor(m / 12) - 1}`
}

export async function noteFrequency(args: { midi?: number }): Promise<string> {
  const m = Math.round(args.midi ?? -1)
  if (m < 0 || m > 127) throw new MidiError("MIDI note must be 0 to 127")
  const freq = A4 * Math.pow(2, (m - 69) / 12)
  return `${m} (${NAMES[m % 12]}${Math.floor(m / 12) - 1}): ${freq.toFixed(2)} Hz`
}

export async function noteFromName(args: { name?: string }): Promise<string> {
  const name = (args.name ?? "").trim()
  const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(name)
  if (!m) throw new MidiError("Provide a note like C4 or F#3")
  let n = NAMES.indexOf(m[1].toUpperCase())
  if (m[2] === "#") n += 1
  if (m[2] === "b") n -= 1
  const midi = (Number(m[3]) + 1) * 12 + ((n % 12) + 12) % 12
  const freq = A4 * Math.pow(2, (midi - 69) / 12)
  return `${name}: MIDI ${midi}, ${freq.toFixed(2)} Hz`
}

// ---- muxB tools:
const LETTER_SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const LETTER_ORDER = ["C", "D", "E", "F", "G", "A", "B"]

const CHORD_QUALITIES: Record<string, { label: string; steps: number[] }> = {
  major: { label: "major", steps: [0, 4, 7] },
  minor: { label: "minor", steps: [0, 3, 7] },
  dim: { label: "diminished", steps: [0, 3, 6] },
  aug: { label: "augmented", steps: [0, 4, 8] },
  sus2: { label: "suspended 2nd", steps: [0, 2, 7] },
  sus4: { label: "suspended 4th", steps: [0, 5, 7] },
  maj6: { label: "major 6th", steps: [0, 4, 7, 9] },
  min6: { label: "minor 6th", steps: [0, 3, 7, 9] },
  dom7: { label: "dominant 7th", steps: [0, 4, 7, 10] },
  maj7: { label: "major 7th", steps: [0, 4, 7, 11] },
  min7: { label: "minor 7th", steps: [0, 3, 7, 10] },
  m7b5: { label: "half-diminished 7th", steps: [0, 3, 6, 10] },
  dim7: { label: "diminished 7th", steps: [0, 3, 6, 9] },
  add9: { label: "added 9th", steps: [0, 4, 7, 14] },
  dom9: { label: "dominant 9th", steps: [0, 4, 7, 10, 14] },
  maj9: { label: "major 9th", steps: [0, 4, 7, 11, 14] },
  min9: { label: "minor 9th", steps: [0, 3, 7, 10, 14] },
}

const SCALES: Record<string, { label: string; steps: number[]; diatonic: boolean }> = {
  major: { label: "major (Ionian)", steps: [0, 2, 4, 5, 7, 9, 11], diatonic: true },
  "natural minor": { label: "natural minor (Aeolian)", steps: [0, 2, 3, 5, 7, 8, 10], diatonic: true },
  "harmonic minor": { label: "harmonic minor", steps: [0, 2, 3, 5, 7, 8, 11], diatonic: true },
  "melodic minor": { label: "melodic minor (ascending)", steps: [0, 2, 3, 5, 7, 9, 11], diatonic: true },
  dorian: { label: "Dorian", steps: [0, 2, 3, 5, 7, 9, 10], diatonic: true },
  phrygian: { label: "Phrygian", steps: [0, 1, 3, 5, 7, 8, 10], diatonic: true },
  lydian: { label: "Lydian", steps: [0, 2, 4, 6, 7, 9, 11], diatonic: true },
  mixolydian: { label: "Mixolydian", steps: [0, 2, 4, 5, 7, 9, 10], diatonic: true },
  locrian: { label: "Locrian", steps: [0, 1, 3, 5, 6, 8, 10], diatonic: true },
  "harmonic major": { label: "harmonic major", steps: [0, 2, 4, 5, 7, 8, 11], diatonic: true },
  "major pentatonic": { label: "major pentatonic", steps: [0, 2, 4, 7, 9], diatonic: false },
  "minor pentatonic": { label: "minor pentatonic", steps: [0, 3, 5, 7, 10], diatonic: false },
  blues: { label: "blues", steps: [0, 3, 5, 6, 7, 10], diatonic: false },
  "whole tone": { label: "whole tone", steps: [0, 2, 4, 6, 8, 10], diatonic: false },
  chromatic: { label: "chromatic", steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], diatonic: false },
}

const INTERVAL_NAMES: Record<number, string> = {
  0: "unison (perfect 1st)",
  1: "minor 2nd",
  2: "major 2nd",
  3: "minor 3rd",
  4: "major 3rd",
  5: "perfect 4th",
  6: "tritone (augmented 4th)",
  7: "perfect 5th",
  8: "minor 6th",
  9: "major 6th",
  10: "minor 7th",
  11: "major 7th",
}

const freqOf = (midi: number) => A4 * Math.pow(2, (midi - 69) / 12)
const nameOf = (midi: number) => `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
const midiLine = (midi: number) => `   ${nameOf(midi)}  midi ${midi}  ${freqOf(midi).toFixed(2)} Hz`

/** "C4" / "F#3" / "Bb2" -> MIDI number. */
function parseNoteArg(raw: string, defaultOctave: number): { midi: number } {
  const value = (raw ?? "").trim()
  if (!value) throw new MidiError("Provide a note name, e.g. C4, F#3 or Bb2")
  const m = /^([A-Ga-g])([#b]?)(-?\d{1,2})?$/.exec(value)
  if (!m) throw new MidiError(`Cannot read the note "${value}". Use a name like C4, F#3 or Bb2`)
  const letter = m[1].toUpperCase()
  const octave = m[3] === undefined ? defaultOctave : parseInt(m[3], 10)
  if (octave < -1 || octave > 9) throw new MidiError(`Octave ${octave} is out of range, use -1 to 9`)
  const midi = (octave + 1) * 12 + LETTER_SEMITONE[letter] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0)
  if (midi < 0 || midi > 127) throw new MidiError(`"${value}" is outside MIDI 0-127`)
  return { midi }
}

/**
 * Key signature of a 7-note diatonic scale, read off the letters of its own
 * degrees: every diatonic scale is a rotation of the major scale, so counting up
 * from the root's letter gives the letter each degree is spelled with.
 */
function keySignature(rootMidi: number, steps: number[]): string {
  // The root is spelled with sharps, like every note this server prints, so the
  // signature reported below always matches the note list above it.
  const start = LETTER_ORDER.indexOf(NAMES[((rootMidi % 12) + 12) % 12][0])
  const sharps: string[] = []
  const flats: string[] = []
  const other: string[] = []
  steps.forEach((step, index) => {
    const letter = LETTER_ORDER[(start + index) % 7]
    const natural = LETTER_SEMITONE[letter]
    const actual = ((rootMidi + step) % 12 + 12) % 12
    if (actual === natural) return
    if (actual === (natural + 1) % 12) sharps.push(letter)
    else if (actual === (natural + 11) % 12) flats.push(letter)
    else other.push(letter)
  })
  const parts: string[] = []
  if (sharps.length) parts.push(`${sharps.length} sharp${sharps.length > 1 ? "s" : ""} (${sharps.join(", ")})`)
  if (flats.length) parts.push(`${flats.length} flat${flats.length > 1 ? "s" : ""} (${flats.join(", ")})`)
  if (other.length) parts.push(`chromatically altered: ${other.join(", ")}`)
  return parts.length ? parts.join(", ") : "no sharps or flats, as in C major / A minor"
}

export async function buildScale(args: { root?: string; scale?: string; octaves?: number; octave?: number }): Promise<string> {
  const rootText = (args.root ?? "").trim()
  if (!rootText) throw new MidiError("Provide a root note, e.g. C4 or D3")
  const scaleKey = (args.scale ?? "major").trim().toLowerCase()
  const scale = SCALES[scaleKey]
  if (!scale) {
    throw new MidiError(`Unknown scale "${scaleKey}". Use one of: ${Object.keys(SCALES).join(", ")}`)
  }
  const octave = args.octave === undefined ? 4 : Math.trunc(Number(args.octave))
  if (!Number.isFinite(octave) || octave < -1 || octave > 9) throw new MidiError("Octave must be -1 to 9")
  const octaves = Math.min(Math.max(Math.trunc(Number(args.octaves ?? 2)), 1), 4)
  const root = parseNoteArg(rootText, octave)
  const notes: number[] = []
  for (let o = 0; o < octaves; o++) {
    for (const step of scale.steps) {
      const value = root.midi + step + 12 * o
      if (value > 127) break
      notes.push(value)
    }
  }
  if (notes.some((value) => value < 0)) throw new MidiError("That range leaves MIDI 0-127. Use a higher octave")
  const rootName = rootText.replace(/-?\d+$/, "")
  return [
    `${rootName} ${scale.label} - ${scale.steps.length} notes per octave, ${octaves} octave${octaves > 1 ? "s" : ""}, ${notes.length} notes`,
    scale.diatonic
      ? `Key signature: ${keySignature(root.midi, scale.steps)}, counted on the note names above`
      : "Key signature: not diatonic, so no single key signature applies",
    ...notes.map(midiLine),
  ].join("\n")
}

export async function interval(args: { from?: string; to?: string; semitones?: number }): Promise<string> {
  const from = (args.from ?? "").trim()
  const to = (args.to ?? "").trim()
  if (from && to) {
    const a = parseNoteArg(from, 4)
    const b = parseNoteArg(to, 4)
    const distance = b.midi - a.midi
    const simple = ((distance % 12) + 12) % 12
    const octaves = Math.trunc(Math.abs(distance) / 12)
    const beyond = octaves ? `, ${octaves} octave${octaves > 1 ? "s" : ""}${distance % 12 ? " plus a " + (INTERVAL_NAMES[Math.abs(distance) % 12] ?? "step") : ""}` : ""
    return [
      `${nameOf(a.midi)} -> ${nameOf(b.midi)}`,
      `   semitones: ${distance}${distance < 0 ? ` (${distance + 12} as a simple upward interval)` : ""}`,
      `   interval: ${INTERVAL_NAMES[simple]}${beyond}`,
      `   frequency ratio: ${(freqOf(b.midi) / freqOf(a.midi)).toFixed(4)} ${distance >= 0 ? "up" : "down"}`,
    ].join("\n")
  }
  if (from || to) throw new MidiError("Give both from and to, or neither")
  const semitones = Math.trunc(Number(args.semitones))
  if (args.semitones === undefined || !Number.isFinite(semitones)) {
    throw new MidiError("Give a from and a to note, or a semitone count")
  }
  if (semitones < 0 || semitones > 127) throw new MidiError("Semitones must be 0 to 127")
  const a4 = parseNoteArg("A4", 4)
  const target = a4.midi + semitones
  if (target > 127) throw new MidiError(`A4 plus ${semitones} semitones leaves MIDI 0-127`)
  const octaves = Math.trunc(semitones / 12)
  const compound = octaves ? `${octaves} octave${octaves > 1 ? "s" : ""} plus ` : ""
  return [
    `${compound}${INTERVAL_NAMES[semitones % 12]} - ${semitones} semitones above A4`,
    `   A4  midi 69  ${freqOf(a4.midi).toFixed(2)} Hz`,
    `   ${midiLine(target)}`,
  ].join("\n")
}
