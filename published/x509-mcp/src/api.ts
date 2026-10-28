/**
 * X.509 Certificates — keyless public API client.
 */

export class SourceError extends Error {}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

import { X509Certificate } from "node:crypto"
import { connect } from "node:tls"

const PEM_BLOCK = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g

function daysLeft(cert: X509Certificate): number {
  const expiry = cert.validToDate ? new Date(cert.validToDate).getTime() : Date.parse(cert.validTo)
  return Math.floor((expiry - Date.now()) / 86400000)
}

function cn(subject: string): string {
  const m = subject.match(/(?:^|,)\s*CN=([^,]+)/)
  return m ? m[1] : ""
}

const EKU_NAMES: Record<string, string> = {
  "1.3.6.1.5.5.7.3.1": "serverAuth",
  "1.3.6.1.5.5.7.3.2": "clientAuth",
  "1.3.6.1.5.5.7.3.3": "codeSigning",
  "1.3.6.1.5.5.7.3.4": "emailProtection",
  "1.3.6.1.5.5.7.3.8": "timeStamping",
  "1.3.6.1.5.5.7.3.9": "OCSPSigning",
  "2.5.29.37.0": "anyExtendedKeyUsage",
}

function dn(value: string): string {
  return value.split(/\n+/).map((part) => part.trim()).filter(Boolean).join(", ")
}

function describe(cert: X509Certificate, label: string): string[] {
  const key = cert.publicKey
  const details = (key.asymmetricKeyDetails ?? {}) as { modulusLength?: number; namedCurve?: string }
  const keyText = [key.asymmetricKeyType ?? "unknown", details.modulusLength ? `${details.modulusLength} bits` : "", details.namedCurve ?? ""]
    .filter(Boolean)
    .join(" ")
  const sans = String(cert.subjectAltName ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const left = daysLeft(cert)
  // Node exposes the extended-key-usage OIDs on keyUsage; show them by name.
  const usage = ((cert.keyUsage ?? []) as string[]).map((oid) => EKU_NAMES[oid] ?? oid).filter(Boolean)
  return [
    `${label}${cn(cert.subject) ? ` — ${cn(cert.subject)}` : ""}`,
    `  subject:   ${dn(cert.subject)}`,
    `  issuer:    ${dn(cert.issuer)}`,
    `  serial:    ${cert.serialNumber}`,
    `  valid:     ${new Date(cert.validFromDate ?? Date.parse(cert.validFrom)).toISOString()} -> ${new Date(cert.validToDate ?? Date.parse(cert.validTo)).toISOString()}`,
    `  expires:   ${left >= 0 ? `in ${left} day(s)` : `${-left} day(s) ago (EXPIRED)`}`,
    `  key:       ${keyText}`,
    `  ca:        ${cert.ca ? "yes" : "no"}`,
    usage.length ? `  usage:     ${usage.join(", ")}` : "",
    sans.length ? `  names:     ${sans.slice(0, 12).join(", ")}${sans.length > 12 ? ` (+${sans.length - 12} more)` : ""}` : "",
    `  sha256:    ${cert.fingerprint256}`,
  ].filter(Boolean)
}

function loadCerts(pem: string): X509Certificate[] {
  const blocks = pem.match(PEM_BLOCK) ?? []
  const certs: X509Certificate[] = []
  for (const block of blocks) {
    try {
      certs.push(new X509Certificate(block))
    } catch (e) {
      throw new SourceError(`could not parse a PEM block: ${(e as Error).message}`)
    }
  }
  if (!certs.length) throw new SourceError("no PEM certificate found (expected -----BEGIN CERTIFICATE-----)")
  if (certs.length > 12) throw new SourceError("at most 12 certificates at a time")
  return certs
}

export async function decodePem(a: { pem: string }): Promise<string> {
  const certs = loadCerts(a.pem)
  return [
    `${certs.length} certificate(s) decoded:`,
    "",
    ...certs.flatMap((cert, i) => [...describe(cert, `Certificate ${i + 1}`), ""]),
  ].join("\n").trim()
}

export async function checkExpiry(a: { pem: string }): Promise<string> {
  const certs = loadCerts(a.pem)
  const rows = certs.map((cert, i) => {
    const left = daysLeft(cert)
    const state = left < 0 ? "EXPIRED" : left <= 30 ? "expiring soon" : "ok"
    return `${i + 1}. ${cn(cert.subject) || cert.subject.slice(0, 50)} — ${state} (${left} day(s) left, ${new Date(cert.validToDate ?? Date.parse(cert.validTo)).toISOString()})`
  })
  const soonest = Math.min(...certs.map(daysLeft))
  return [
    `${certs.length} certificate(s):`,
    "",
    ...rows,
    "",
    soonest < 0 ? "At least one certificate has expired." : `Soonest expiry: in ${soonest} day(s).`,
  ].join("\n")
}

export async function tlsCertificate(a: { host: string; port?: number }): Promise<string> {
  const host = clean(a.host).toLowerCase()
  if (!/^[a-z0-9][a-z0-9.-]{1,252}[a-z0-9]$/.test(host)) throw new SourceError(`"${a.host}" does not look like a host name`)
  const port = Math.floor(a.port ?? 443)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new SourceError("port must be between 1 and 65535")
  const info = await new Promise<{ cert: X509Certificate; authorized: boolean; reason: string; protocol: string; chain: number }>(
    (resolve, reject) => {
      const socket = connect(
        { host, port, servername: host, rejectUnauthorized: false, timeout: 12000 },
        () => {
          try {
            // Read the detailed (legacy) view first: asking for the X509Certificate
            // clears the cached peer certificate, which would leave the chain empty.
            const detailed: any = socket.getPeerCertificate(true)
            const cert = socket.getPeerX509Certificate()
            if (!cert) {
              reject(new SourceError("the server presented no certificate"))
              socket.destroy()
              return
            }
            let chain = 0
            let current: any = detailed
            const seen = new Set<string>()
            while (current?.fingerprint256 && !seen.has(String(current.fingerprint256))) {
              seen.add(String(current.fingerprint256))
              chain++
              current = current.issuerCertificate
              if (chain > 10) break
            }
            resolve({
              cert,
              authorized: socket.authorized,
              reason: socket.authorizationError ? String(socket.authorizationError) : "",
              protocol: socket.getProtocol() ?? "unknown",
              chain,
            })
          } catch (e) {
            reject(e)
          } finally {
            socket.destroy()
          }
        }
      )
      socket.on("timeout", () => {
        socket.destroy()
        reject(new SourceError("the TLS handshake timed out"))
      })
      socket.on("error", (err: Error) => reject(new SourceError(`could not connect: ${err.message}`)))
    }
  )
  return [
    `TLS certificate for ${host}:${port} (${info.protocol}, chain of ${info.chain}):`,
    "",
    ...describe(info.cert, "Peer certificate"),
    `  verified:  ${info.authorized ? "yes, the chain validates" : `no${info.reason ? ` (${info.reason})` : ""}`}`,
  ].join("\n")
}
