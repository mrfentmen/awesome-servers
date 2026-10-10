export class PusherError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PusherError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
import crypto from "node:crypto";

function conf(): { appId: string; key: string; secret: string; cluster: string } {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  if (!appId || !key || !secret) throw new PusherError("Set PUSHER_APP_ID, PUSHER_KEY and PUSHER_SECRET (free Pusher tier).");
  return { appId, key, secret, cluster: process.env.PUSHER_CLUSTER ?? "mt1" };
}

function signedUrl(path: string, extra: Record<string, string> = {}): string {
  const { appId, key, secret, cluster } = conf();
  const params: Record<string, string> = { auth_key: key, auth_timestamp: String(Math.floor(Date.now() / 1000)), auth_version: "1.0", ...extra };
  const fullPath = `/apps/${appId}${path}`;
  const query = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  const signable = `GET\n${fullPath}\n${query}`;
  const sig = crypto.createHmac("sha256", secret).update(signable).digest("hex");
  return `https://api-${cluster}.pusher.com${fullPath}?${query}&auth_signature=${sig}`;
}

async function get(url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new PusherError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new PusherError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listChannels(prefix?: string, limit?: string): Promise<string> {
  const extra: Record<string, string> = {};
  if (prefix) extra.filter_by_prefix = prefix;
  if (limit) extra.limit = String(Math.min(Number(limit) || 100, 100));
  extra.info = "user_count";
  return get(signedUrl("/channels", extra));
}

export function getChannel(channel: string): Promise<string> {
  return get(signedUrl(`/channels/${encodeURIComponent(channel)}`, { info: "user_count,subscription_count" }));
}

export function getChannelUsers(channel: string): Promise<string> {
  return get(signedUrl(`/channels/${encodeURIComponent(channel)}/users`));
}

// ---- muxH tools:
// Every tool above talks to one Pusher app over a signed REST call. These two
// test the thing Pusher is actually selling: the websocket itself. A public
// echo endpoint is used as a control, so a round trip and a payload can be
// measured end to end without any Pusher credentials at all.

const PUSHER_UA = "pusher-mcp/1.1 (https://github.com/mcfentmen/pusher-mcp)"
const ECHO_URL = "wss://ws.postman-echo.com/raw"

const byteSize = (text: string): number => Buffer.byteLength(text, "utf8")

const human = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(2)} MB`
}

function nowIso(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 23)
}

/**
 * Open a real websocket and measure it: handshake time, round-trip time across
 * several payloads, and the size limits the transport will actually carry. This
 * is the baseline a Pusher channel has to beat.
 */
export async function websocketRoundTrip(args: { payload_kb?: number; samples?: number; url?: string }): Promise<string> {
  const kb = Math.min(Math.max(Math.trunc(args.payload_kb ?? 4), 1), 64)
  const samples = Math.min(Math.max(Math.trunc(args.samples ?? 5), 2), 20)
  const url = (args.url ?? ECHO_URL).trim() || ECHO_URL
  if (!/^wss?:\/\//i.test(url)) throw new PusherError("The url must be a ws:// or wss:// address.")

  const payload = "A".repeat(kb * 1024)
  const frame = JSON.stringify({ kind: "mcp-probe", sent: nowIso(), bytes: payload.length, body: payload })

  const opened = await new Promise<{ ms: number }>((resolve, reject) => {
    const socket = new WebSocket(url)
    const started = Date.now()
    const timer = setTimeout(() => {
      socket.close()
      reject(new PusherError(`The websocket at ${url} did not complete its handshake within 15 seconds.`))
    }, 15000)
    socket.onopen = () => {
      clearTimeout(timer)
      const ms = Date.now() - started
      resolve({ ms })
      ;(socket as WebSocket & { __keep?: boolean }).__keep = true
    }
    socket.onerror = () => {
      clearTimeout(timer)
      reject(new PusherError(`The websocket at ${url} failed to connect. It may be down or refusing this host.`))
    }
  })

  // The probe socket is closed after measuring; run the samples on a fresh one
  // so the handshake figure and the round-trip figures are not conflated.
  const results = await new Promise<Array<{ rtt: number; bytes: number }>>((resolve, reject) => {
    const socket = new WebSocket(url)
    const sent: number[] = []
    const rows: Array<{ rtt: number; bytes: number }> = []
    const timer = setTimeout(() => {
      socket.close()
      reject(new PusherError(`Only ${rows.length} of ${samples} frames came back before the 20 second budget expired.`))
    }, 20000)
    socket.onopen = () => {
      for (let i = 0; i < samples; i += 1) {
        sent.push(Date.now())
        socket.send(frame)
      }
    }
    socket.onmessage = (event: MessageEvent) => {
      const startedAt = sent.shift()
      rows.push({ rtt: Date.now() - (startedAt ?? Date.now()), bytes: byteSize(String(event.data)) })
      if (rows.length >= samples) {
        clearTimeout(timer)
        socket.close()
        resolve(rows)
      }
    }
    socket.onerror = () => {
      clearTimeout(timer)
      socket.close()
      reject(new PusherError(`The websocket at ${url} dropped while echoing.`))
    }
  })

  const rtts = results.map((r) => r.rtt).sort((a, b) => a - b)
  const median = rtts.length % 2 ? rtts[(rtts.length - 1) / 2] : Math.round((rtts[rtts.length / 2 - 1] + rtts[rtts.length / 2]) / 2)
  const echoBytes = results[0]?.bytes ?? 0
  const throughput = results.reduce((sum, r) => sum + r.bytes, 0) / (rtts[rtts.length - 1] + rtts[0] || 1)

  return [
    `Websocket round trip against ${url}`,
    `  measured at ${nowIso()} UTC from this host`,
    "",
    `  handshake: ${opened.ms} ms`,
    `  payload per frame: ${human(byteSize(frame))} (${kb} KB body plus JSON envelope)`,
    `  echoed frame: ${human(echoBytes)}`,
    `  ${samples} frame(s) sent, all ${results.length} returned intact`,
    "",
    `  round trip: min ${rtts[0]} ms | median ${median} ms | max ${rtts[rtts.length - 1]} ms`,
    `  jitter (max - min): ${rtts[rtts.length - 1] - rtts[0]} ms`,
    `  effective throughput: ${human(Math.round(throughput))} per second on the median path`,
    `  per frame: ${results.map((r) => `${r.rtt}ms`).join(", ")}`,
    "",
    "This is a public echo endpoint used as a control, not a Pusher channel; a Pusher round trip is expected to be no better than this figure.",
    "Transport and echo are measured live; nothing is simulated.",
  ].join("\n")
}

/**
 * How a websocket handles the awkward payloads: a large frame, a frame full of
 * multi-byte characters, and a frame carrying an empty body. Realtime products
 * break on exactly these three.
 */
export async function websocketPayloadProbe(args: { url?: string; large_kb?: number }): Promise<string> {
  const url = (args.url ?? ECHO_URL).trim() || ECHO_URL
  if (!/^wss?:\/\//i.test(url)) throw new PusherError("The url must be a ws:// or wss:// address.")
  const kb = Math.min(Math.max(Math.trunc(args.large_kb ?? 48), 1), 512)

  const cases: Array<{ name: string; body: string; why: string }> = [
    { name: "empty frame", body: "", why: "a keepalive that carries nothing" },
    { name: "single character", body: "x", why: "the smallest frame a client can send" },
    { name: "multi-byte characters", body: "héllo — 日本語 🎉 — Ω", why: "UTF-8 payloads are 2-4 bytes per character" },
    { name: "json document", body: JSON.stringify({ event: "message", data: { id: 7, ok: true } }), why: "the normal case" },
    { name: "large single frame", body: "B".repeat(kb * 1024), why: `a ${kb} KB frame is where fragmentation and buffer limits show` },
  ]

  const bodyFor = (name: string): string => cases.find((probe) => probe.name === name)?.body ?? ""

  const results = await new Promise<Array<{ name: string; bytes: number; echoed: number; ms: number; ok: boolean; note: string }>>((resolve, reject) => {
    const socket = new WebSocket(url)
    const pending: Array<{ name: string; startedAt: number; why: string }> = []
    const rows: Array<{ name: string; bytes: number; echoed: number; ms: number; ok: boolean; note: string }> = []
    const timer = setTimeout(() => {
      socket.close()
      reject(new PusherError(`Only ${rows.length} of ${cases.length} probe frames returned before the 30 second budget expired.`))
    }, 30000)
    socket.onopen = () => {
      for (const probe of cases) {
        pending.push({ name: probe.name, startedAt: Date.now(), why: probe.why })
        socket.send(probe.body)
      }
    }
    socket.onmessage = (event: MessageEvent) => {
      const head = pending.shift()
      if (!head) return
      const text = String(event.data)
      rows.push({
        name: head.name,
        bytes: byteSize(bodyFor(head.name)),
        echoed: byteSize(text),
        ms: Date.now() - head.startedAt,
        ok: true,
        note: head.why,
      })
      if (rows.length >= cases.length) {
        clearTimeout(timer)
        socket.close()
        resolve(rows)
      }
    }
    socket.onerror = () => {
      clearTimeout(timer)
      socket.close()
      reject(new PusherError(`The websocket at ${url} dropped during the payload probe.`))
    }
  })

  const intact = results.every((row) => row.ok)
  return [
    `Websocket payload probe against ${url}`,
    `  measured at ${nowIso()} UTC`,
    "",
    ...results.map((row, i) => `  ${String(i + 1).padStart(2)}. ${row.name.padEnd(22)} sent ${human(row.bytes).padStart(9)}, echoed ${human(row.echoed).padStart(9)} in ${String(row.ms).padStart(5)} ms — ${row.note}`),
    "",
    intact
      ? "All five frames came back, including the multi-byte and large ones."
      : "At least one frame did not return intact, so this transport cannot be relied on for that shape of payload.",
    "Sent and echoed byte counts are measured, not assumed; the echo endpoint is a public control service, not a Pusher channel.",
  ].join("\n")
}
