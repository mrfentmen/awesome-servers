import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { writeFile, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const DEFAULT_GIMP_PATH = process.env.GIMP_PATH || "/Applications/GIMP.app/Contents/Resources/lib/gimp/2.99"
const ALT_GIMP_PATHS = ["/usr/bin/gimp", "/usr/local/bin/gimp", "/opt/homebrew/bin/gimp"]

function findGimp(): string {
  const customPath = process.env.GIMP_PATH
  if (customPath) return customPath
  for (const p of ALT_GIMP_PATHS) {
    if (existsSync(p)) return p
  }
  return "gimp"
}

async function runGimpScript(script: string): Promise<string> {
  const scriptPath = join(await mkdtemp(join(tmpdir(), "gimp-")), "script.py")
  await writeFile(scriptPath, script)

  const pythonScript = `
import sys
sys.path.insert(0, '${DEFAULT_GIMP_PATH}')
import gimp
from gimp import pdb
${script}
gimp.errors.drift()
`

  const pythonPath = join(await mkdtemp(join(tmpdir(), "gimp-")), "gimp_script.py")
  await writeFile(pythonPath, pythonScript)

  return new Promise((resolve, reject) => {
    const proc = spawn(
      findGimp(),
      ["-i", "-b", `(python-fu-evaluate RUN-NONINTERACTIVE "${pythonPath}")`, "-b", "(gimp-quit 0)"],
      { stdio: ["pipe", "pipe", "pipe"] },
    )

    let stdout = ""
    let stderr = ""

    proc.stdout.on("data", (data) => {
      stdout += data.toString()
    })
    proc.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    proc.on("close", (code) => {
      void rm(scriptPath, { force: true }).catch(() => {})
      void rm(pythonPath, { force: true }).catch(() => {})
      if (code === 0) resolve(stdout || stderr)
      else reject(new Error(`GIMP exited with code ${code}: ${stderr}`))
    })
  })
}

async function runGimpConsoleScript(script: string): Promise<string> {
  const scriptPath = join(await mkdtemp(join(tmpdir(), "gimp-")), "script.scm")
  await writeFile(scriptPath, script)

  return new Promise((resolve, reject) => {
    const proc = spawn(findGimp(), ["-i", "-b", script, "-b", "(gimp-quit 0)"], { stdio: ["pipe", "pipe", "pipe"] })

    let stdout = ""
    let stderr = ""

    proc.stdout.on("data", (data) => {
      stdout += data.toString()
    })
    proc.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    proc.on("close", (code) => {
      void rm(scriptPath, { force: true }).catch(() => {})
      if (code === 0) resolve(stdout || stderr)
      else reject(new Error(`GIMP exited with code ${code}: ${stderr}`))
    })
  })
}

export async function openImage(filepath: string): Promise<any> {
  const script = `
image = pdb.gimp_file_load('${filepath}', '${filepath}')
pdb.gimp_display_new(image)
print(image.name)
`
  return runGimpConsoleScript(
    `(let* ((image (car (gimp-file-load RUN-NONINTERACTIVE "${filepath}" "${filepath}")))) (gimp-displays-flush) (gimp-display-new image) (let ((name (car (gimp-image-get-name image)))) (gimp-message name) (gimp-image-delete image)) (gimp-displays-flush))`,
  )
}

export async function saveImage(filepath: string, output?: string): Promise<any> {
  const out = output || filepath
  const script = `(let* ((image (car (gimp-file-load RUN-NONINTERACTIVE "${filepath}" "${filepath}"))) (drawable (car (gimp-image-get-active-layer image)))) (gimp-file-save RUN-NONINTERACTIVE image drawable "${out}" "${out}") (gimp-image-delete image))`
  return runGimpConsoleScript(script)
}

export async function exportImage(filepath: string, output: string, format = "png"): Promise<any> {
  const out = output
  const script = `(let* ((image (car (gimp-file-load RUN-NONINTERACTIVE "${filepath}" "${filepath}"))) (drawable (car (gimp-image-get-active-layer image)))) (file-${format}-save RUN-NONINTERACTIVE image drawable "${out}" "${out}") (gimp-image-delete image))`
  return runGimpConsoleScript(script)
}

export async function resizeImage(filepath: string, width: number, height: number, output?: string): Promise<any> {
  const out = output || filepath
  const script = `(let* ((image (car (gimp-file-load RUN-NONINTERACTIVE "${filepath}" "${filepath}"))) (drawable (car (gimp-image-get-active-layer image)))) (gimp-image-scale image ${width} ${height}) (gimp-file-save RUN-NONINTERACTIVE image drawable "${out}" "${out}") (gimp-image-delete image))`
  return runGimpConsoleScript(script)
}

export async function getImageInfo(filepath: string): Promise<any> {
  const script = `(let* ((image (car (gimp-file-load RUN-NONINTERACTIVE "${filepath}" "${filepath}"))) (width (car (gimp-image-width image))) (height (car (gimp-image-height image))) (drawable (car (gimp-image-get-active-layer image))) (mode (car (gimp-drawable-mode drawable))) (name (car (gimp-image-get-name image))) (type (car (gimp-image-type image)))) (gimp-message (string-append "Name: " name ", Width: " (number->string width) ", Height: " (number->string height) ", Mode: " (number->string mode) ", Type: " (number->string type))) (gimp-image-delete image))`
  const result = await runGimpConsoleScript(script)
  return parseGimpMessage(result)
}

export async function listLayers(filepath: string): Promise<any> {
  const script = `(let* ((image (car (gimp-file-load RUN-NONINTERACTIVE "${filepath}" "${filepath}"))) (layers (gimp-image-get-layers image)) (num-layers (car layers)) (layer-ids (cadr layers)) (i 0) (result '())) (while (< i num-layers) (let* ((layer-id (aref layer-ids i)) (layer (car (gimp-layer-ref layer-id))) (name (car (gimp-item-get-name layer)))) (set! result (cons (list (number->string (aref layer-ids i)) name) result))) (set! i (+ i 1))) (gimp-message (write result)) (gimp-image-delete image))`

  return runGimpConsoleScript(script)
}

export async function applyFilter(
  filepath: string,
  filter: string,
  params: Record<string, unknown>,
  output?: string,
): Promise<any> {
  const out = output || filepath
  let filterCall = ""

  if (filter === "blur") {
    filterCall = `(plug-in-gauss RUN-NONINTERACTIVE image drawable ${params.radius || 5} ${params.radius || 5} 1)`
  } else if (filter === "sharpen") {
    filterCall = `(plug-in-unsharp-mask RUN-NONINTERACTIVE image drawable ${params.amount || 0.5} ${params.radius || 50} ${params.threshold || 0})`
  } else if (filter === "brightness-contrast") {
    filterCall = `(gimp-brightness-contrast drawable ${params.brightness || 0} ${params.contrast || 0})`
  } else if (filter === "grayscale") {
    filterCall = `(gimp-desaturate drawable)`
  }

  const script = `(let* ((image (car (gimp-file-load RUN-NONINTERACTIVE "${filepath}" "${filepath}"))) (drawable (car (gimp-image-get-active-layer image)))) ${filterCall} (gimp-file-save RUN-NONINTERACTIVE image drawable "${out}" "${out}") (gimp-image-delete image))`

  return runGimpConsoleScript(script)
}

export async function batchProcess(pattern: string, script: string): Promise<any> {
  const fullScript = `
import glob
import os

files = glob.glob("${pattern}")
for f in files:
    image = pdb.gimp_file_load(f, f)
    drawable = pdb.gimp_image_get_active_layer(image)
    ${script}
    pdb.gimp_file_save(image, drawable, f, f)
    pdb.gimp_image_delete(image)
print(f"Processed {len(files)} files")
`
  return runGimpScript(fullScript)
}

function parseGimpMessage(output: string): any {
  const lines = output.split("\n")
  for (const line of lines) {
    const msg = line.match(/[^:]+:\s*(.*)/)
    if (msg && msg[1] && !line.includes("gimp-") && !line.includes("plug-in-")) {
      return { message: msg[1].trim() }
    }
  }
  return { raw: output }
}

export { findGimp }
