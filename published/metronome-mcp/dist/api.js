export class MetronomeError extends Error {
}
export async function bpmToMs(args) {
    const bpm = args.bpm ?? 0;
    if (bpm <= 0 || bpm > 400)
        throw new MetronomeError("BPM must be between 1 and 400");
    const beatsPerBar = args.beats_per_bar ?? 4;
    const beatMs = 60000 / bpm;
    const barMs = beatMs * beatsPerBar;
    return `BPM ${bpm}\nOne beat: ${beatMs.toFixed(1)} ms\nOne bar (${beatsPerBar} beats): ${barMs.toFixed(1)} ms\nBeats per second: ${(bpm / 60).toFixed(2)}`;
}
export async function noteDuration(args) {
    const bpm = args.bpm ?? 0;
    if (bpm <= 0 || bpm > 400)
        throw new MetronomeError("BPM must be between 1 and 400");
    const q = 60000 / bpm;
    const names = [
        ["Whole", 4], ["Half", 2], ["Quarter", 1], ["Eighth", 0.5], ["16th", 0.25], ["32nd", 0.125],
    ];
    return names.map(([n, mult]) => `${n}: ${(q * mult).toFixed(1)} ms`).join("\n");
}
