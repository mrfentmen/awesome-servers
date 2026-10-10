export class MetronomeError extends Error {}

export async function bpmToMs(args: { bpm?: number; beats_per_bar?: number }): Promise<string> {
  const bpm = args.bpm ?? 0
  if (bpm <= 0 || bpm > 400) throw new MetronomeError("BPM must be between 1 and 400")
  const beatsPerBar = args.beats_per_bar ?? 4
  const beatMs = 60000 / bpm
  const barMs = beatMs * beatsPerBar
  return `BPM ${bpm}\nOne beat: ${beatMs.toFixed(1)} ms\nOne bar (${beatsPerBar} beats): ${barMs.toFixed(1)} ms\nBeats per second: ${(bpm / 60).toFixed(2)}`
}

export async function noteDuration(args: { bpm?: number }): Promise<string> {
  const bpm = args.bpm ?? 0
  if (bpm <= 0 || bpm > 400) throw new MetronomeError("BPM must be between 1 and 400")
  const q = 60000 / bpm
  const names: Array<[string, number]> = [
    ["Whole", 4], ["Half", 2], ["Quarter", 1], ["Eighth", 0.5], ["16th", 0.25], ["32nd", 0.125],
  ]
  return names.map(([n, mult]) => `${n}: ${(q * mult).toFixed(1)} ms`).join("\n")
}

// ---- muxB tools:

type MbRecording = {
  id?: string;
  title?: string;
  length?: number | null;
  'first-release-date'?: string | null;
  score?: number;
  'artist-credit'?: { artist?: { id?: string; name?: string } }[];
  releases?: { title?: string; date?: string }[];
}

type WdEntity = {
  id?: string;
  labels?: Record<string, { value?: string }>;
  descriptions?: Record<string, { value?: string } | { value?: string }[]>;
  claims?: Record<string, WdSnak[]>;
}

type WdSnak = { mainsnak?: { datavalue?: { value?: { id?: string } | { time?: string } | { amount?: string; unit?: string } | string } } }

