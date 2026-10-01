/**
 * Tasmota HTTP API client. Points at one device via TASMOTA_URL
 * (default http://localhost). Optional TASMOTA_USER + TASMOTA_PASSWORD
 * for devices with web password set.
 * Docs: https://tasmota.github.io/docs/Commands/
 */
const BASE = (process.env.TASMOTA_URL ?? "http://localhost").replace(/\/+$/, "")

export class TasmotaError extends Error {}

function authSuffix(): string {
  if (process.env.TASMOTA_USER && process.env.TASMOTA_PASSWORD) {
    return `&user=${encodeURIComponent(process.env.TASMOTA_USER)}&password=${encodeURIComponent(process.env.TASMOTA_PASSWORD)}`
  }
  return ""
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function command<T>(cmnd: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}/cm?cmnd=${encodeURIComponent(cmnd)}${authSuffix()}`, {
      headers: { "User-Agent": "tasmota-mcp/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new TasmotaError(`Tasmota at ${BASE} is unreachable. Set TASMOTA_URL.`)
  }
  if (res.status === 401 || res.status === 403) throw new TasmotaError("Tasmota refused (401/403). Check user/password.")
  if (!res.ok) throw new TasmotaError(`Tasmota error ${res.status}`)
  return (await res.json()) as T
}

export async function fullStatus(): Promise<string> {
  const d = await command<Raw>("Status 0")
  const net = (d.StatusNET ?? {}) as Raw
  const sts = (d.StatusSTS ?? {}) as Raw
  const prm = (d.StatusPRM ?? {}) as Raw
  const lines = [
    `Device: ${d.Status?.DeviceName ?? "?"} (${d.Status?.Hostname ?? "?"})`,
    `Firmware: ${sts.Version ?? prm.StartupUTC ?? "?"}`.replace("Firmware: ?", "Firmware: ?"),
    `Power: ${sts.POWER ?? "?"}`,
    `Uptime: ${sts.Uptime ?? "?"}`,
    `Wifi: ${net.Hostname ?? "?"} (${net.RSSI ?? "?"} dBm)`,
    `Topic: ${prm.MqttFullTopic ?? d.Status?.Topic ?? "?"}`,
  ]
  return lines.join("\n")
}

export async function setPower(state: "on" | "off" | "toggle", outlet = 1): Promise<string> {
  const cmd = outlet > 1 ? `Power${outlet} ${state}` : `Power ${state}`
  const d = await command<Raw>(cmd)
  const key = outlet > 1 ? `POWER${outlet}` : "POWER"
  return `Power is now ${d[key] ?? state.toUpperCase()}.`
}

export async function readSensor(): Promise<string> {
  const d = await command<Raw>("Status 8")
  const sns = (d.StatusSNS ?? {}) as Raw
  if (Object.keys(sns).length === 0) return "No sensors reporting."
  const lines = Object.entries(sns).slice(0, 10).map(([k, v]) => {
    if (v && typeof v === "object") {
      const inner = Object.entries(v as Raw).map(([ik, iv]) => `${ik}=${String(iv)}`).join(", ")
      return `${k}: ${inner}`
    }
    return `${k}: ${String(v)}`
  })
  return lines.join("\n")
}

// ---- muxB tools:

interface TasmotaTopicArgs {
  device_name?: string
  topic?: string
  prefix?: string
  suffix?: string
  full_topic?: string
}

const TASMOTA_STATUS_PAYLOADS = [
  { n: 0, what: "module status, device name, uptime, wifi" },
  { n: 1, what: "core: boot, uptime, heap, loop time" },
  { n: 2, what: "logging settings" },
  { n: 3, what: "heap usage by block" },
  { n: 4, what: "playback / mp3 settings" },
  { n: 5, what: "drivers and buses" },
  { n: 6, what: "timers and schedules" },
  { n: 7, what: "logging rules" },
  { n: 8, what: "sensor and energy data" },
  { n: 9, what: "sysinfo: uptime, heap, network" },
  { n: 10, what: "GPIO driver state" },
  { n: 11, what: "I2C driver state" },
  { n: 12, what: "SPI driver state" },
  { n: 13, what: "UART driver state" },
]

function tasClean(name: string | undefined, fallback: string): string {
  const trimmed = String(name ?? "").trim()
  return trimmed.length > 0 ? trimmed : fallback
}

/** Substitute Tasmota's topic placeholders, keeping the trailing slash the way Tasmota does. */
function tasResolve(template: string, prefixValue: string, topicValue: string): string {
  const out = template.replace(/%prefix%/g, prefixValue).replace(/%topic%/g, topicValue)
  return out.startsWith("/") ? out.slice(1) : out
}

export async function mqttTopics(args: TasmotaTopicArgs): Promise<string> {
  const device = tasClean(args.device_name, "tasmota_XXXXXX")
  const topic = tasClean(args.topic, device)
  const prefix = tasClean(args.prefix, "%prefix%")
  const suffix = String(args.suffix ?? "").trim()
  const explicit = String(args.full_topic ?? "").trim()
  const full = explicit.length > 0 ? explicit : `${prefix}/${topic}/${suffix}`
  const cmndBase = tasResolve(full, "cmnd", topic)
  const statBase = tasResolve(full, "stat", topic)
  const teleBase = tasResolve(full, "tele", topic)
  const notes: string[] = []
  if (prefix === topic && !explicit) {
    notes.push("%prefix% and %topic% are both \"" + topic + "\", so this is Tasmota's \"no prefix\" layout: the device is addressed at " + cmndBase + " instead of cmnd/" + topic + "/.")
  }
  if (full.includes("%prefix%")) {
    notes.push("%prefix% is not one string: Tasmota replaces it with cmnd for the topic you publish to, stat for the topic it answers on, and tele for telemetry.")
  }
  if (full.includes("%topic%")) notes.push("%topic% resolves to " + topic + ".")
  if (full.includes("%suffix%")) notes.push("%suffix% was resolved to " + (suffix.length ? suffix : "(empty)") + ".")
  const out = [
    'MQTT topics for a Tasmota device named "' + device + '".',
    "",
    "Topic options in play: %full_topic% = " + full + (prefix === "%prefix%" ? "  (default form)" : "  (with %prefix% = " + prefix + ")"),
    "Resolved: publish " + cmndBase + ", subscribe " + statBase + ", telemetry " + teleBase,
    "",
    "Publish (command) topics - send these:",
    "  " + cmndBase + "Power, " + cmndBase + "Power1..8",
    "  " + cmndBase + "Dimmer, " + cmndBase + "Speed, " + cmndBase + "Color, " + cmndBase + "ColorCT, " + cmndBase + "ColorHSB",
    "  " + cmndBase + "State, " + cmndBase + "Backlog, " + cmndBase + "Restart 1, " + cmndBase + "OtaUrl",
    "",
    "Subscribe (state) topics - these come back:",
    "  " + statBase + "POWER, " + statBase + "RESULT, " + statBase + "LIGHT, " + statBase + "ENERGY",
    "",
    "Telemetry topics:",
    "  " + teleBase + "LWT             online/offline, retained, arrives on connect",
    "  " + teleBase + "INFO1..3        module name, firmware version, build date and compiler",
    "  " + teleBase + "STATE           JSON of the whole device state",
    "  " + teleBase + "RESULT          the raw reply to a Status N query",
    "  " + teleBase + "SENSOR / SENSOR_JSON / ENERGY",
    "",
    "Where a Status N reply lands:",
    "  Status 0-7 replies arrive on " + statBase + "RESULT",
    "  Status 8 and above replies arrive on " + teleBase + "RESULT",
  ].concat(
    TASMOTA_STATUS_PAYLOADS.map((s) => "    Status " + s.n + ": " + s.what)
  )
  out.push(
    "",
    'Subscribe with: "' + cmndBase + '#", "' + statBase + '#" and "' + teleBase + '#".'
  )
  if (notes.length) out.push("", ...notes.map((n) => "- " + n))
  return out.join("\n")
}

export interface TasmotaStep {
  power?: "on" | "off" | "toggle"
  outlet?: number
  dimmer?: number
  speed?: number
  color?: string
  color_temp?: number
  delay?: number
}

export interface TasmotaCmdArgs {
  steps: TasmotaStep[]
  url?: string
}

const TASMOTA_POWER = { on: "On", off: "Off", toggle: "Toggle" } as const

export async function cmndPayload(args: TasmotaCmdArgs): Promise<string> {
  const steps = Array.isArray(args.steps) ? args.steps : []
  if (steps.length === 0) {
    return "Give at least one step, e.g. steps: [{power: 'on', outlet: 1, dimmer: 60}, {delay: 2, power: 'off', outlet: 1}]."
  }
  const base = String(args.url ?? process.env.TASMOTA_URL ?? "http://localhost").replace(/\/+$/, "")
  const warnings: string[] = []
  const commands: string[] = []
  const backlog: Array<Record<string, string | number>> = []
  steps.slice(0, 12).forEach((step, i) => {
    const where = `step ${i + 1}`
    const wanted = Number(step.outlet ?? 1)
    const outlet = Math.min(Math.max(Math.round(wanted), 1), 8)
    const entry: Record<string, string | number> = {}
    if (step.delay !== undefined) {
      const delay = Math.min(Math.max(Math.round(Number(step.delay)), 0), 3600)
      entry.Delay = delay
      commands.push(`Delay ${delay}`)
    }
    if (step.power !== undefined) {
      const key = outlet > 1 ? `Power${outlet}` : "Power"
      entry[key] = TASMOTA_POWER[step.power]
      commands.push(`${key} ${TASMOTA_POWER[step.power]}`)
    }
    if (step.dimmer !== undefined) {
      const dimmer = Math.min(Math.max(Math.round(Number(step.dimmer)), 0), 100)
      entry.Dimmer = dimmer
      commands.push(`Dimmer ${dimmer}`)
      if (dimmer === 0) {
        warnings.push(`${where}: Dimmer 0 also switches the relay off, so add an explicit power state if you only meant "dark".`)
      }
    }
    if (step.speed !== undefined) {
      const speed = Math.min(Math.max(Math.round(Number(step.speed)), 0), 10)
      entry.Speed = speed
      commands.push(`Speed ${speed}`)
    }
    if (step.color !== undefined) {
      const hex = String(step.color).trim().replace(/^#/, "")
      if (/^[0-9a-f]{6}$/i.test(hex)) {
        entry.Color = hex.toUpperCase()
        commands.push(`Color ${hex.toUpperCase()}`)
      } else {
        warnings.push(`${where}: "${step.color}" is not six hex digits, so the colour was dropped.`)
      }
    }
    if (step.color_temp !== undefined) {
      const ct = Math.round(Number(step.color_temp))
      if (ct === 0) {
        entry.ColorCT = 0
        commands.push("ColorCT 0")
        warnings.push(`${where}: ColorCT 0 resets the bulb to its own default white, it is not a colour temperature.`)
      } else if (ct < 1530 || ct > 9000) {
        warnings.push(`${where}: ${ct}K is outside the 1530-9000K a Tasmota colour-temperature bulb accepts, so it was dropped.`)
      } else {
        entry.ColorCT = ct
        commands.push(`ColorCT ${ct}`)
      }
    }
    if (Object.keys(entry).length > 0) backlog.push(entry)
  })
  if (backlog.length === 0) {
    return warnings.length > 0
      ? `Nothing sendable: ${warnings.join(" ")}`
      : "None of the steps carried a sendable field. Use power, dimmer, speed, color or color_temp."
  }
  const body = JSON.stringify(backlog.length === 1 ? backlog[0] : backlog)
  return [
    `${backlog.length} Tasmota command object(s) built from ${steps.length} step(s).`,
    "",
    "JSON command body (Tasmota's JSON API):",
    body,
    "",
    "As a request:",
    `  GET ${base}/cm?cmnd=${encodeURIComponent(body)}`,
    `  POST ${base}/cm   Content-Type: application/json   body: ${body}`,
    "",
    "Equivalent console commands:",
    ...commands.map((c) => `  ${c}`),
    "",
    "A Backlog of several objects runs them in order, and a Delay inside an object pauses before that",
    "object's other fields, which is how you script fade-then-switch-off without extra round trips.",
    ...(warnings.length ? ["", ...warnings.map((w) => `- ${w}`)] : []),
  ].join("\n")
}
