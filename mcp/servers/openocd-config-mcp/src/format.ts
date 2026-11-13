import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const COMMANDS = new Set([
  "adapter", "transport", "ftdi_device_desc", "ftdi_vid_pid", "ftdi_serial", "ftdi_location", "ftdi_tdo_sample_edge",
  "ftdi_layout_init", "ftdi_layout_signal", "set", "unset", "jtag", "target", "flash", "init", "reset", "halt",
  "resume", "shutdown", "echo", "source", "script", "proc", "foreach", "if", "else", "elseif", "while", "for",
  "catch", "ocd_find", "ocd_process_reset", "dap", "cortex_m", "gdb", "telnet", "tcl", "bindto", "poll",
  "wait_halt", "soft_reset_halt", "step", "reg", "mdw", "mww", "mem2array", "array2mem", "arm", "xscale", "fpga",
  "pld", "nand", "nor", "mflash", "virtual", "pathmove", "irscan", "drscan", "runtest", "newtap", "swd",
])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const logical: string[] = []
  let buffer = ""

  if (text.trim().length === 0) issues.push({ code: "empty", severity: "error", message: "Document is empty" })

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line && !buffer) continue
    if (line.startsWith("#") && !buffer) continue
    buffer += buffer ? ` ${line}` : line
    if (buffer.endsWith("\\")) {
      buffer = buffer.slice(0, -1).trim()
      continue
    }
    logical.push(buffer)
    buffer = ""
  }
  if (buffer) logical.push(buffer)

  const source = logical.join("\n")
  const quotes = (source.match(/"/g) ?? []).length
  if (quotes % 2 !== 0) issues.push({ code: "unbalanced-quotes", severity: "error", message: "Unbalanced double quotes" })
  const openBraces = (source.match(/\{/g) ?? []).length
  const closeBraces = (source.match(/\}/g) ?? []).length
  if (openBraces !== closeBraces) issues.push({ code: "unbalanced-braces", severity: "error", message: `Unbalanced braces: ${openBraces} open, ${closeBraces} close` })

  let targets = 0
  let flashBanks = 0
  let transport = ""
  let speed = 0

  logical.forEach((line, index) => {
    const lineNo = index + 1
    if (!line || line.startsWith("#")) return
    const command = line.split(/\s+/)[0]
    const args = line.slice(command.length).trim()
    if (!COMMANDS.has(command) && !command.startsWith("ocd_") && !command.startsWith("$_")) {
      issues.push({ code: "unknown-command", severity: "warning", message: `Unknown OpenOCD command ${command}`, line: lineNo })
    }
    if (command === "transport") {
      const select = /^select\s+(\S+)$/.exec(args)
      if (!select) issues.push({ code: "bad-transport", severity: "error", message: "transport needs select jtag or select swd", line: lineNo })
      else if (!["jtag", "swd"].includes(select[1])) issues.push({ code: "bad-transport", severity: "error", message: `Unknown transport ${select[1]}`, line: lineNo })
      else transport = select[1]
    }
    if (command === "adapter") {
      const speedMatch = /^speed\s+(\d+)$/.exec(args)
      if (args.startsWith("speed") && !speedMatch) issues.push({ code: "bad-speed", severity: "error", message: "adapter speed needs a number", line: lineNo })
      if (speedMatch) {
        speed = Number(speedMatch[1])
        if (speed <= 0) issues.push({ code: "bad-speed", severity: "error", message: "adapter speed must be positive", line: lineNo })
      }
    }
    if (command === "ftdi_vid_pid") {
      const values = args.split(/\s+/).filter(Boolean)
      if (![2, 4].includes(values.length) || values.some((value) => !/^0x[0-9A-Fa-f]+$/.test(value))) {
        issues.push({ code: "bad-vid-pid", severity: "error", message: "ftdi_vid_pid needs two or four hex values", line: lineNo })
      }
    }
    if (command === "target" && args.startsWith("create")) {
      const parts = args.split(/\s+/)
      if (parts.length < 3) issues.push({ code: "bad-target", severity: "error", message: "target create needs a name and a type", line: lineNo })
      else targets += 1
    }
    if (command === "flash" && args.startsWith("bank")) {
      const parts = args.split(/\s+/)
      if (parts.length < 5) issues.push({ code: "bad-flash", severity: "error", message: "flash bank needs name, driver, base and size", line: lineNo })
      if (parts[3] && !/^0x[0-9A-Fa-f]+$|^\d+$/.test(parts[3])) issues.push({ code: "bad-base", severity: "error", message: `Invalid flash base ${parts[3]}`, line: lineNo })
      if (parts[4] && !/^0x[0-9A-Fa-f]+$|^\d+$/.test(parts[4])) issues.push({ code: "bad-size", severity: "error", message: `Invalid flash size ${parts[4]}`, line: lineNo })
      flashBanks += 1
    }
    records.push({ id: `command:${records.length + 1}`, kind: "command", fields: { command, args, line: lineNo } })
  })

  if (records.length === 0) issues.push({ code: "no-commands", severity: "error", message: "No OpenOCD commands found" })
  if (!transport) issues.push({ code: "no-transport", severity: "warning", message: "No transport select command" })
  if (targets === 0) issues.push({ code: "no-target", severity: "warning", message: "No target create command" })

  return { format: "OpenOCD", records, meta: { commands: records.length, targets, flashBanks, transport, speed }, issues }
}

const reference = [
  "OpenOCD config",
  "",
  "adapter driver ftdi",
  "adapter speed 4000",
  "transport select swd",
  'ftdi_device_desc "Demo Adapter"',
  "ftdi_vid_pid 0x0403 0x6014",
  "",
  "set _CHIPNAME demo",
  "jtag newtap $_CHIPNAME cpu -irlen 4",
  "target create $_CHIPNAME.cpu cortex_m -chain-position $_CHIPNAME.cpu",
  "flash bank demo.flash stm32f1x 0x08000000 0x10000 0 0 $_CHIPNAME.cpu",
  "init",
  "reset halt",
  "",
  "Commands are Tcl words, one command per line.",
  "transport select accepts jtag or swd.",
  "target create needs a name and target type.",
  "flash bank needs name, driver, base and size.",
].join("\n")

export const format: FormatModule = {
  slug: "openocd-config",
  displayName: "OpenOCD",
  extensions: [".cfg", "openocd.cfg"],
  description: "Parse OpenOCD configs, validate transports, targets, flash banks and quotes.",
  reference,
  parse,
  sample: () =>
    [
      "adapter driver ftdi",
      "adapter speed 4000",
      "transport select swd",
      'ftdi_device_desc "Demo Adapter"',
      "ftdi_vid_pid 0x0403 0x6014",
      "",
      "set _CHIPNAME demo",
      "jtag newtap $_CHIPNAME cpu -irlen 4",
      "target create $_CHIPNAME.cpu cortex_m -chain-position $_CHIPNAME.cpu",
      "flash bank demo.flash stm32f1x 0x08000000 0x10000 0 0 $_CHIPNAME.cpu",
      "init",
      "reset halt",
    ].join("\n") + "\n",
}
