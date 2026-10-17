// ---- muxE tools:
// Every existing tool here drives Adobe Premiere Pro through ExtendScript, so
// all eleven of them need the application installed and running. The two new
// tools deliberately do not: one is a pure timecode calculator, and one probes
// a media file with the ffprobe binary the machine already has. Both are local,
// both add a capability no existing tool has, and neither needs Premiere.
import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";

const PROBE_CANDIDATES = ["ffprobe", "/usr/local/bin/ffprobe", "/opt/homebrew/bin/ffprobe", "/usr/bin/ffprobe"];

function run(command: string, args: string[], timeout: number): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        const detail = (stderr || error.message || "").trim().slice(0, 300);
        reject(new Error(detail || `${command} failed`));
        return;
      }
      resolve(stdout);
    });
  });
}

async function findProbe(): Promise<string> {
  for (const candidate of PROBE_CANDIDATES) {
    try {
      await run(candidate, ["-version"], 10000);
      return candidate;
    } catch {
      // try the next location
    }
  }
  throw new Error("ffprobe was not found. Install ffmpeg and put ffprobe on PATH, or set FFPROBE_PATH.");
}

const tag = (value: unknown): string =>
  value === undefined || value === null || value === "" ? "not reported" : String(value);

export interface MediaProbeArgs {
  path: string;
}

export async function mediaProbe(args: MediaProbeArgs): Promise<string> {
  const target = (args?.path ?? "").trim();
  if (!target) throw new Error("Provide the path of a local media file.");
  let size = 0;
  try {
    size = (await stat(target)).size;
  } catch {
    throw new Error(`No file at ${target}.`);
  }
  if (size === 0) throw new Error(`${target} is empty.`);
  const override = (process.env.FFPROBE_PATH ?? "").trim();
  const binary = override || (await findProbe());
  const raw = await run(binary, ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", target], 60000);
  let probe: { format?: Record<string, unknown>; streams?: Array<Record<string, unknown>> };
  try {
    probe = JSON.parse(raw) as typeof probe;
  } catch {
    throw new Error("ffprobe answered with a body that is not JSON.");
  }
  const format = probe.format ?? {};
  const streams = Array.isArray(probe.streams) ? probe.streams : [];
  if (!streams.length) throw new Error(`ffprobe found no stream in ${target}.`);
  const duration = Number(format.duration);
  const bitrate = Number(format.bit_rate);
  const lines = [
    `Media file ${target}`,
    `  size on disk: ${size.toLocaleString("en-US")} bytes`,
    `  container: ${tag(format.format_name)}`,
    `  format long name: ${tag(format.format_long_name)}`,
    `  duration: ${Number.isFinite(duration) ? `${duration.toFixed(3)} seconds` : "not reported"}`,
    `  overall bit rate: ${Number.isFinite(bitrate) ? `${bitrate.toLocaleString("en-US")} bits per second` : "not reported"}`,
    `  streams: ${streams.length}`,
  ];
  const countOf = (type: string): number => streams.filter((s) => s.codec_type === type).length;
  const video = countOf("video");
  const audio = countOf("audio");
  const subtitle = countOf("subtitle");
  lines.push(`    video ${video}, audio ${audio}, subtitle ${subtitle}, other ${streams.length - video - audio - subtitle}`);
  streams.slice(0, 12).forEach((s, i) => {
    const type = tag(s.codec_type);
    lines.push(`  stream ${i + 1}, ${type}:`);
    lines.push(`    codec: ${tag(s.codec_name)}${s.codec_long_name ? ` (${String(s.codec_long_name).slice(0, 80)})` : ""}${s.profile ? `, profile ${tag(s.profile)}` : ""}`);
    if (type === "video") {
      const [n, d] = String(s.avg_frame_rate ?? "0/0").split("/").map(Number);
      const fps = n > 0 && d > 0 ? n / d : null;
      lines.push(`    size: ${tag(s.width)}x${tag(s.height)}, display aspect ${tag(s.display_aspect_ratio)}, pixel format ${tag(s.pix_fmt)}`);
      lines.push(`    frame rate: ${tag(s.r_frame_rate)} nominal, ${tag(s.avg_frame_rate)} average${fps ? ` (${fps.toFixed(3)} fps)` : ""}`);
      lines.push(`    frames: ${tag(s.nb_frames)}, field order: ${tag(s.field_order)}`);
    } else if (type === "audio") {
      lines.push(`    sample rate: ${tag(s.sample_rate)} Hz, channels: ${tag(s.channels)}${s.channel_layout ? ` (${tag(s.channel_layout)})` : ""}`);
      lines.push(`    bits per sample: ${tag(s.bits_per_sample)}, stream bit rate: ${tag(s.bit_rate)}`);
    } else {
      lines.push(`    language: ${tag((s.tags as Record<string, unknown> | undefined)?.language)}, stream bit rate: ${tag(s.bit_rate)}`);
    }
    if (typeof s.duration === "string" && s.duration) lines.push(`    stream duration: ${s.duration} seconds`);
  });
  if (streams.length > 12) lines.push(`    and ${streams.length - 12} more stream(s) not listed here`);
  const tags = (format.tags as Record<string, unknown> | undefined) ?? {};
  const keys = Object.keys(tags);
  if (keys.length) {
    lines.push("  container tags:");
    for (const k of keys.slice(0, 12)) lines.push(`    ${k}: ${String(tags[k]).slice(0, 80)}`);
    if (keys.length > 12) lines.push(`    and ${keys.length - 12} more tag(s)`);
  }
  lines.push("  every figure above is what ffprobe read out of the file itself, not a stored summary.");
  return lines.join("\n");
}

interface Rate {
  label: string;
  nominal: number;
  drop: boolean;
}

/** nominal is the integer frame count the clock counts in, fps is the real rate */
const RATES: Rate[] = [
  { label: "23.976", nominal: 24, drop: false },
  { label: "24", nominal: 24, drop: false },
  { label: "25", nominal: 25, drop: false },
  { label: "29.97", nominal: 30, drop: true },
  { label: "30", nominal: 30, drop: false },
  { label: "50", nominal: 50, drop: false },
  { label: "59.94", nominal: 60, drop: false },
  { label: "60", nominal: 60, drop: false },
];

const rateOf = (label: string): Rate => {
  const hit = RATES.find((r) => r.label === label);
  if (!hit) throw new Error(`Timecode rates are ${RATES.map((r) => r.label).join(", ")} only.`);
  return hit;
};
const fpsOf = (r: Rate): number => (r.nominal === 24 ? 24 : r.nominal === 25 ? 25 : r.nominal === 30 ? 30000 / 1001 : r.nominal === 50 ? 50 : r.nominal === 60 ? 60000 / 1001 : r.nominal);

const clockToFrames = (clock: string, r: Rate): number => {
  const m = /^(\d{1,3}):([0-5]\d):([0-5]\d)[:;](\d{1,3})$/.exec(clock);
  if (!m) throw new Error("Timecode must look like 01:23:45:12, and a semicolon may replace the last colon for drop frame.");
  const [, h, mm, ss, ff] = m;
  const frames = Number(ff);
  if (frames >= r.nominal) throw new Error(`At ${r.label} a frame number runs 0 to ${r.nominal - 1}, and ${ff} is out of range.`);
  const total = (Number(h) * 3600 + Number(mm) * 60 + Number(ss)) * r.nominal + frames;
  if (!r.drop) return total;
  // drop frame skips frame numbers 00 and 01 at every minute except every tenth
  const dropPerMinute = r.nominal === 30 ? 2 : 4;
  const minutes = Number(h) * 60 + Number(mm);
  return total - dropPerMinute * (minutes - Math.floor(minutes / 10));
};

const framesToClock = (frameNumber: number, r: Rate): string => {
  let n = frameNumber;
  if (r.drop) {
    // 29.97 drops 18 frames across every ten minutes, 59.94 drops 36
    const dropPerMinute = r.nominal === 30 ? 2 : 4;
    const framesPer10Min = r.nominal * 600 - dropPerMinute * 9;
    const blocks = Math.floor(n / framesPer10Min);
    const rest = n % framesPer10Min;
    n += 18 * blocks * (dropPerMinute / 2) + (rest < dropPerMinute ? 0 : dropPerMinute * Math.floor((rest - dropPerMinute) / (r.nominal * 60 - dropPerMinute)));
  }
  const frames = n % r.nominal;
  const totalSeconds = Math.floor(n / r.nominal);
  const ss = totalSeconds % 60;
  const mm = Math.floor(totalSeconds / 60) % 60;
  const hh = Math.floor(totalSeconds / 3600);
  const sep = r.drop ? ";" : ":";
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}${sep}${String(frames).padStart(2, "0")}`;
};

export interface TimecodeConvertArgs {
  value: string;
  rate?: string;
}

export async function timecodeConvert(args: TimecodeConvertArgs): Promise<string> {
  const value = (args?.value ?? "").trim();
  if (!value) throw new Error("Provide a timecode like 01:23:45:12, or a number of seconds.");
  const r = rateOf((args?.rate ?? "25").trim() || "25");
  const fps = fpsOf(r);
  const isClock = /^\d{1,3}:[0-5]\d:[0-5]\d[:;]\d{1,3}$/.test(value);
  let frames: number;
  if (isClock) {
    frames = clockToFrames(value, r);
  } else {
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds < 0) throw new Error("A value in seconds must be a non negative number.");
    frames = Math.round(seconds * fps);
  }
  const seconds = frames / fps;
  const lines = [
    `Timecode at ${r.label}, ${fps.toFixed(3)} fps${r.drop ? ", drop frame" : ", non drop"}:`,
    `  read: ${isClock ? value : `${Number(value).toLocaleString("en-US")} seconds`}`,
    `  frame number: ${frames.toLocaleString("en-US")}`,
    `  in seconds: ${seconds.toFixed(3)}`,
    `  back to timecode: ${framesToClock(frames, r)}`,
  ];
  lines.push("  the same frame at every broadcast rate:");
  for (const other of RATES) {
    if (other.label === r.label) continue;
    lines.push(`    ${other.label}${other.drop ? " drop" : ""}: ${framesToClock(frames, other)} = ${(frames / fpsOf(other)).toFixed(3)} seconds`);
  }
  if (r.drop) {
    lines.push("  drop frame is only implemented for 29.97 here, where frame numbers 00 and 01 are skipped at every minute except every tenth; 59.94 is reported as non drop.");
  }
  return lines.join("\n");
}


export async function searchArchiveFootage(args: { query?: string; limit?: number }): Promise<string> {
  const query = (args.query ?? 'nasa').trim();
  const limit = Math.max(1, Math.min(20, args.limit ?? 5));
  const searchUrl = 'https://archive.org/advancedsearch.php?q=mediatype:movies+AND+(' + encodeURIComponent(query) + ')&fl[]=identifier,title,creator,date,licenseurl,mediatype&rows=' + limit + '&output=json';
  const res = await fetch(searchUrl, { headers: { 'User-Agent': 'awesome-mcps/1.0', Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error('Internet Archive returned ' + res.status);
  const data = (await res.json()) as { response?: { docs?: Array<Record<string, unknown>>; numFound?: number } };
  const docs = data.response?.docs ?? [];
  if (!docs.length) return 'No archive footage found for "' + query + '".';
  const lines = ['Internet Archive footage search for "' + query + '", ' + docs.length + ' result(s) of ' + (data.response?.numFound ?? '?') + ' total:', ''];
  for (const d of docs) {
    const id = String(d.identifier ?? 'unknown');
    const title = String(d.title ?? 'untitled').slice(0, 120);
    const creator = d.creator ? String(d.creator).slice(0, 80) : 'not reported';
    const date = d.date ? String(d.date).slice(0, 10) : 'not reported';
    const license = d.licenseurl ? String(d.licenseurl) : 'not reported';
    lines.push('• ' + title);
    lines.push('  Creator: ' + creator + ' | Date: ' + date);
    lines.push('  License: ' + license);
    lines.push('  Link: https://archive.org/details/' + id);
    lines.push('');
  }
  return lines.join('\n');
}
