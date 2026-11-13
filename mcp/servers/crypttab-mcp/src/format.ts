import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const seen = new Set<string>()
  const volumes = new Set<string>()

  if (text.trim().length === 0) issues.push({ code: "empty", severity: "error", message: "Document is empty" })

  text.split(/\r?\n/).forEach((raw, index) => {
    const lineNo = index + 1
    const line = raw.trim()
    if (!line || line.startsWith("#")) return
    const fields = line.split(/\s+/)
    if (fields.length < 3) {
      issues.push({ code: "short-line", severity: "error", message: "crypttab needs name, device and key file", line: lineNo })
      return
    }
    const [name, device, keyfile, ...options] = fields
    if (!/^[A-Za-z0-9_.-]+$/.test(name)) issues.push({ code: "bad-name", severity: "error", message: `Invalid volume name ${name}`, line: lineNo })
    if (seen.has(name)) issues.push({ code: "duplicate-name", severity: "error", message: `Duplicate volume ${name}`, line: lineNo })
    seen.add(name)
    if (!/^(\/dev\/|UUID=|LABEL=|PARTUUID=|PARTLABEL=)/i.test(device)) {
      issues.push({ code: "bad-device", severity: "error", message: `Device must be /dev/... or a UUID/LABEL reference: ${device}`, line: lineNo })
    }
    if (keyfile !== "none" && keyfile !== "-" && !keyfile.startsWith("/")) {
      issues.push({ code: "bad-keyfile", severity: "error", message: `Key file must be none, - or an absolute path: ${keyfile}`, line: lineNo })
    }
    if (options.length === 0) issues.push({ code: "no-options", severity: "warning", message: `Volume ${name} has no options`, line: lineNo })
    const optionList = options.join(",").split(",").filter(Boolean)
    for (const option of optionList) {
      if (!/^[A-Za-z0-9_.-]+(?:=[^,\s]+)?$/.test(option)) {
        issues.push({ code: "bad-option", severity: "error", message: `Invalid option ${option}`, line: lineNo })
      }
    }
    volumes.add(name)
    records.push({
      id: `volume:${name}`,
      kind: "volume",
      fields: { name, device, keyfile, options: optionList.join(","), optionCount: optionList.length, line: lineNo },
    })
  })

  if (records.length === 0) issues.push({ code: "no-volumes", severity: "error", message: "No crypttab entries found" })

  return { format: "crypttab", records, meta: { volumes: volumes.size }, issues }
}

const reference = [
  "crypttab",
  "",
  "name device keyfile options",
  "",
  "cryptroot UUID=1234-ABCD none luks,discard",
  "data /dev/sdb1 /etc/keys/data.key luks,key-slot=1",
  "",
  "Fields are whitespace separated; options are comma separated.",
  "The device must be /dev/... or a UUID, LABEL, PARTUUID or PARTLABEL reference.",
  "Key files are absolute paths, none or - for an interactive passphrase.",
].join("\n")

export const format: FormatModule = {
  slug: "crypttab",
  displayName: "crypttab",
  extensions: ["crypttab", ".crypttab"],
  description: "Parse crypttab volumes, validate names, devices and options.",
  reference,
  parse,
  sample: () =>
    [
      "# /etc/crypttab",
      "cryptroot UUID=1234-ABCD none luks,discard",
      "data /dev/sdb1 /etc/keys/data.key luks,key-slot=1",
    ].join("\n") + "\n",
}
