import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const KNOWN = new Set([
  "structure", "parameters", "paraTypeCharmm", "temperature", "timestep", "run", "minimize",
  "outputname", "outputenergies", "outputtiming", "binaryoutput", "restartname", "restartfreq",
  "dcdfreq", "xstFreq", "extendedSystem", "bincoordinates", "binvelocities", "constraints",
  "cutoff", "pairlistdist", "switching", "switchdist", "margin", "fixedAtoms", "langevin",
  "langevinTemp", "langevinDamping", "seed", "cellBasisVector1", "cellBasisVector2",
  "cellBasisVector3", "cellOrigin", "wrapAll", "wrapWater", "exclude", "source", "colvars",
  "numsteps", "firsttimestep", "readexclusions", "rigidBonds", "nonbondedFreq", "fullElectFrequency",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const commands = new Map<string, number>()
  let hasStructure = false
  let hasRun = false
  let hasMinimize = false
  let timestep = 0

  text.split(/\r?\n/).forEach((raw, index) => {
    const number = index + 1
    const line = raw.replace(/#.*$/, "").trim()
    if (line.length === 0) return

    const quotes = (line.match(/"/g) ?? []).length
    if (quotes % 2 !== 0) {
      issues.push({ code: "unclosed-quote", severity: "error", message: "Line has an odd number of quote characters", line: number })
    }

    const tokens = line.replace(/"/g, "").split(/\s+/)
    const command = tokens[0]
    const args = tokens.slice(1)
    commands.set(command, (commands.get(command) ?? 0) + 1)

    if (!KNOWN.has(command)) {
      issues.push({ code: "unknown-command", severity: "warning", message: `Unknown NAMD command: ${command}`, line: number })
    }
    if (command === "structure") hasStructure = true
    if (command === "run") hasRun = true
    if (command === "minimize") hasMinimize = true
    if (command === "timestep") {
      timestep = Number(args[0])
      if (!Number.isFinite(timestep) || timestep <= 0) {
        issues.push({ code: "bad-timestep", severity: "error", message: `timestep must be a positive number: ${args[0]}`, line: number })
      }
    }
    if (command === "temperature" && !Number.isFinite(Number(args[0]))) {
      issues.push({ code: "bad-temperature", severity: "error", message: `temperature must be numeric: ${args[0]}`, line: number })
    }

    records.push({ id: `${command}:${number}`, kind: "command", fields: { command, args: args.join(" ").slice(0, 200), line: number } })
  })

  if (!hasStructure) {
    issues.push({ code: "no-structure", severity: "warning", message: "Configuration has no structure command" })
  }
  if (!hasRun && !hasMinimize) {
    issues.push({ code: "no-job", severity: "error", message: "Configuration has neither run nor minimize" })
  }

  return {
    format: "NAMD",
    records,
    meta: {
      commands: records.length,
      distinct: commands.size,
      timestep,
      hasRun,
      hasMinimize,
      hasStructure,
    },
    issues,
  }
}

const reference = [
  "NAMD configuration",
  "",
  "structure ../input/protein.pdb",
  "parameters ../input/par_all36m_prot.prm",
  "temperature 300",
  "timestep 2.0",
  "minimize 1000",
  "run 10000",
  "",
  "One command per line, then its arguments.",
  "# starts a comment.",
  "A job needs run or minimize.",
  "timestep and temperature must be numeric.",
].join("\n")

export const format: FormatModule = {
  slug: "namd",
  displayName: "NAMD",
  extensions: [".namd", ".conf", ".in"],
  description: "Parse NAMD configurations, validate commands, timestep and job control.",
  reference,
  parse,
  sample: () =>
    [
      "structure demo.pdb",
      "parameters par_all36m_prot.prm",
      "temperature 300",
      "timestep 2.0",
      "minimize 1000",
      "run 10000",
    ].join("\n") + "\n",
}
