import { connect } from "node:tls"

export class CertError extends Error {}

export async function certInfo(args: { host?: string; port?: number }): Promise<string> {
  const host = (args.host ?? "").trim()
  if (!host) throw new CertError("Provide a hostname")
  const port = Math.min(Math.max(args.port ?? 443, 1), 65535)
  const cert = await new Promise<any>((resolve, reject) => {
    const socket = connect({ host, port, servername: host, rejectUnauthorized: false, timeout: 15000 }, () => {
      const c = socket.getPeerCertificate()
      socket.end()
      resolve(c)
    })
    socket.on("error", (e) => reject(new CertError(`TLS error: ${e.message}`)))
    socket.on("timeout", () => { socket.destroy(); reject(new CertError("TLS handshake timed out")) })
  })
  if (!cert || !cert.subject) throw new CertError("No certificate returned")
  const san = (cert.subjectaltname ?? "").split(", ").slice(0, 10).join(", ")
  return [
    `Host: ${host}:${port}`,
    `Subject: ${cert.subject.CN ?? ""} (${cert.subject.O ?? ""})`,
    `Issuer: ${cert.issuer.CN ?? ""} (${cert.issuer.O ?? ""})`,
    `Valid from: ${cert.valid_from ?? ""}`,
    `Valid to: ${cert.valid_to ?? ""}`,
    `Serial: ${cert.serialNumber ?? ""}`,
    `Bits: ${cert.bits ?? ""}`,
    san ? `SAN: ${san}` : "",
  ].filter(Boolean).join("\n")
}

// ---- muxC tools:

/**
 * Open one TLS connection and hand the live socket to the caller, so a tool can
 * read both the certificate and what the handshake actually negotiated.
 */
function tlsConnect(host: string, port: number): Promise<{ socket: any; cert: any }> {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port, servername: host, rejectUnauthorized: false, timeout: 15000 }, () => {
      const cert = socket.getPeerCertificate(true)
      resolve({ socket, cert })
    })
    socket.on("error", (e) => reject(new CertError(`TLS error: ${e.message}`)))
    socket.on("timeout", () => {
      socket.destroy()
      reject(new CertError("TLS handshake timed out"))
    })
  })
}

function hostPort(args: { host?: string; port?: number }): { host: string; port: number } {
  const host = (args.host ?? "").trim()
  if (!host) throw new CertError("Provide a hostname")
  const port = Math.min(Math.max(args.port ?? 443, 1), 65535)
  return { host, port }
}

/** The negotiated protocol version and cipher suite for a host. */
export async function tlsDetails(args: { host?: string; port?: number }): Promise<string> {
  const { host, port } = hostPort(args)
  const { socket, cert } = await tlsConnect(host, port)
  const protocol = String(socket.getProtocol() ?? "not reported")
  const cipher = socket.getCipher() ?? {}
  const authorized = socket.authorized
  const authorizationError = socket.authorizationError
  socket.end()
  return [
    `Host: ${host}:${port}`,
    `Protocol: ${protocol} | cipher: ${String(cipher.name ?? "not reported")} (${String(cipher.standardName ?? "no standard name")})`,
    `Certificate trust: ${authorized ? "verified against the local store" : "not verified"}${authorizationError ? ` (${String(authorizationError)})` : ""}`,
    `Subject: ${cert?.subject?.CN ?? "not reported"} | issuer: ${cert?.issuer?.CN ?? "not reported"}`,
    `Expires: ${cert?.valid_to ?? "not reported"}`,
  ].join("\n")
}

/** How long a certificate has left, and whether it has already expired. */
export async function certExpiry(args: { host?: string; port?: number }): Promise<string> {
  const { host, port } = hostPort(args)
  const { socket, cert } = await tlsConnect(host, port)
  socket.end()
  const to = cert?.valid_to
  const from = cert?.valid_from
  if (!to) throw new CertError(`${host}:${port} returned no expiry date`)
  const expiry = new Date(to)
  if (Number.isNaN(expiry.getTime())) throw new CertError(`${host}:${port} returned an unparseable expiry date: ${to}`)
  const start = from ? new Date(from) : null
  const now = Date.now()
  const daysLeft = Math.floor((expiry.getTime() - now) / 86400000)
  const issued = start && !Number.isNaN(start.getTime()) ? start : null
  const lifetime = issued ? Math.floor((expiry.getTime() - issued.getTime()) / 86400000) : null
  const state = daysLeft < 0 ? "EXPIRED" : daysLeft <= 14 ? "expiring soon" : daysLeft <= 30 ? "expiring within 30 days" : "valid"
  const lines = [
    `Host: ${host}:${port}`,
    `Subject: ${cert?.subject?.CN ?? "not reported"}`,
    `Valid from: ${from ?? "not reported"}`,
    `Expires: ${to}`,
    `Days left: ${daysLeft} (${state})`,
  ]
  if (lifetime !== null) lines.push(`Total lifetime: ${lifetime} days | issued ${Math.floor((expiry.getTime() - issued!.getTime()) / 86400000) - daysLeft} days ago`)
  lines.push(`Fingerprint (SHA-256): ${cert?.fingerprint256 ?? "not reported"}`)
  return lines.join("\n")
}
