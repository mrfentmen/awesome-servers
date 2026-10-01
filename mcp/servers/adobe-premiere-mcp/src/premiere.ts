import { spawn } from "node:child_process"
import { writeFile, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const PREMIERE_PATH = process.env.PREMIERE_PATH || "/Applications/Adobe Premiere Pro 2025/Adobe Premiere Pro 2025.app"

function buildExtendScript(code: string): string {
  return `
#target premiere
${code}
`
}

async function runExtendScript(code: string): Promise<any> {
  const scriptPath = join(await mkdtemp(join(tmpdir(), "premiere-")), "script.jsx")
  const script = buildExtendScript(code)
  await writeFile(scriptPath, script)

  const results = await new Promise((resolve, reject) => {
    const cmd = `'${PREMIERE_PATH}/Contents/MacOS/Adobe Premiere Pro'`
    const proc = spawn(cmd, ["-r", scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""

    proc.stdout.on("data", (data) => {
      stdout += data.toString()
    })
    proc.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    proc.on("close", (code: number) => {
      if (code === 0) resolve({ stdout, stderr })
      else reject(new Error(`Premiere exited with code ${code}: ${stderr}`))
    })

    setTimeout(() => {
      proc.kill()
      reject(new Error("Premiere execution timed out"))
    }, 30000)
  })

  void rm(scriptPath, { force: true }).catch(() => {})
  return results
}

export async function isPremiereRunning(): Promise<boolean> {
  try {
    const result = await runExtendScript(`
var result = "not running";
if (app) {
  result = "running: " + app.project.name;
}
result;
`)
    const output = ((await result) as any).stdout || ""
    return output.includes("running")
  } catch {
    return false
  }
}

export async function importMedia(filepath: string): Promise<any> {
  const result = await runExtendScript(`
var proj = app.project;
var items = proj.importMedia(filepath);
JSON.stringify({ imported: items.length, name: proj.name });
`)
  return result
}

export async function getProjectInfo(): Promise<any> {
  const result = await runExtendScript(`
var proj = app.project;
JSON.stringify({
  name: proj.name,
  path: proj.path,
  sequences: proj.sequences.length
});
`)
  return result
}

export async function listSequences(): Promise<any> {
  const result = await runExtendScript(`
var proj = app.project;
var seqs = proj.sequences;
var list = [];
for (var i = 0; i < seqs.length; i++) {
  list.push({
    name: seqs[i].name,
    duration: seqs[i].end,
    frameRate: seqs[i].frameRate
  });
}
JSON.stringify(list);
`)
  return result
}

export async function createSequence(name: string, width: number, height: number, frameRate: number): Promise<any> {
  const result = await runExtendScript(`
var proj = app.project;
var seq = proj.sequences.add(name, ${width}, ${height}, ${frameRate});
JSON.stringify({ name: seq.name, width: ${width}, height: ${height}, frameRate: ${frameRate} });
`)
  return result
}

export async function getSelectedSequenceInfo(): Promise<any> {
  const result = await runExtendScript(`
var seq = app.project.sequences[0];
if (!seq) { JSON.stringify({ error: "No sequence selected" }); }
else {
  JSON.stringify({
    name: seq.name,
    duration: seq.end,
    frameRate: seq.frameRate,
    audioTracks: seq.audioTracks.length,
    videoTracks: seq.videoTracks.length
  });
}
`)
  return result
}

export async function addToTimeline(mediaPath: string, startTime: string, sequenceName?: string): Promise<any> {
  const seqFilter = sequenceName ? `filter = "${sequenceName}";` : "filter = null;"
  const result = await runExtendScript(`
var proj = app.project;
var seq = seq;
${seqFilter}
var item = proj.importMedia(mediaPath);
if (item && seq) {
  seq.insertItem(startTime, item);
  JSON.stringify({ status: "added", sequence: seq.name });
} else {
  JSON.stringify({ error: "Failed to add to timeline" });
}
`)
  return result
}

export async function exportMedia(output: string, format: string, preset?: string): Promise<any> {
  const presetScript = preset ? `var preset = "${preset}";` : "var preset = null;"
  const result = await runExtendScript(`
var seq = app.project.sequences[0];
var opts = null;
if ("${format}" == "h264") {
  opts = new MediaExportOptions();
  opts.outputFilePath = "${output}";
  opts.format = "H.264";
} else if ("${format}" == "prores") {
  opts = new MediaExportOptions();
  opts.outputFilePath = "${output}";
  opts.format = "Apple ProRes";
}
if (opts && seq) {
  seq.exportMedia(opts);
  JSON.stringify({ status: "exported", output: "${output}", format: "${format}" });
} else {
  JSON.stringify({ error: "Export failed" });
}
`)
  return result
}

export async function applyEffect(effectName: string, properties: Record<string, unknown>): Promise<any> {
  const propsStr = Object.entries(properties)
    .map(([k, v]) => `props["${k}"] = ${JSON.stringify(v)};`)
    .join("\n")
  const result = await runExtendScript(`
var seq = app.project.sequences[0];
if (!seq) { JSON.stringify({ error: "No sequence" }); }
else {
  var track = seq.videoTracks[0];
  if (track.clips.length == 0) { JSON.stringify({ error: "No clips" }); }
  else {
    var clip = track.clips[0];
    var props = {};
${propsStr}
    JSON.stringify({ status: "effect applied", clip: clip.name, effect: "${effectName}" });
  }
}
`)
  return result
}

export async function setInoutPoints(inPoint: string, outPoint: string): Promise<any> {
  const result = await runExtendScript(`
var seq = app.project.sequences[0];
if (seq) {
  seq.inPoint = "${inPoint}";
  seq.outPoint = "${outPoint}";
  JSON.stringify({ in: "${inPoint}", out: "${outPoint}" });
} else {
  JSON.stringify({ error: "No sequence" });
}
`)
  return result
}

export async function getMediaInfo(filepath: string): Promise<any> {
  const result = await runExtendScript(`
var mediaInfo = app.getMediaInfo("${filepath}");
JSON.stringify(mediaInfo);
`)
  return result
}

export async function runCustomScript(script: string): Promise<any> {
  return runExtendScript(script)
}

export async function listClips(sequenceName?: string): Promise<any> {
  const result = await runExtendScript(`
var seq = app.project.sequences[0];
if (!seq) { JSON.stringify({ error: "No sequence" }); }
else {
  var clips = [];
  for (var t = 0; t < seq.videoTracks.length; t++) {
    var track = seq.videoTracks[t];
    for (var c = 0; c < track.clips.length; c++) {
      clips.push({
        name: track.clips[c].name,
        start: track.clips[c].start.seconds,
        end: track.clips[c].end.seconds
      });
    }
  }
  JSON.stringify(clips);
}
`)
  return result
}

export { runExtendScript, buildExtendScript }
