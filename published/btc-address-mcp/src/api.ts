/**
 * Bitcoin Addresses — keyless public API client.
 */

export class SourceError extends Error {}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

import { createHash } from "node:crypto"

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
const BECH32_CHARS = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"

function sha256(data: Buffer): Buffer {
  return createHash("sha256").update(data).digest()
}

function base58Decode(text: string): Buffer {
  let num = 0n
  for (const ch of text) {
    const index = B58.indexOf(ch)
    if (index < 0) throw new SourceError(`"${text}" is not valid base58`)
    num = num * 58n + BigInt(index)
  }
  const bytes: number[] = []
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn))
    num >>= 8n
  }
  for (const ch of text) {
    if (ch !== "1") break
    bytes.unshift(0)
  }
  return Buffer.from(bytes)
}

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
  let chk = 1
  for (const value of values) {
    const top = chk >> 25
    chk = ((chk & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) chk ^= GEN[i]
    }
  }
  return chk
}

function bech32HrpExpand(hrp: string): number[] {
  const out: number[] = []
  for (const ch of hrp) out.push(ch.charCodeAt(0) >> 5)
  out.push(0)
  for (const ch of hrp) out.push(ch.charCodeAt(0) & 31)
  return out
}

function convertBits(data: number[], from: number, to: number): number[] | null {
  let acc = 0
  let bits = 0
  const out: number[] = []
  const maxv = (1 << to) - 1
  for (const value of data) {
    if (value < 0 || value >> from !== 0) return null
    acc = (acc << from) | value
    bits += from
    while (bits >= to) {
      bits -= to
      out.push((acc >> bits) & maxv)
    }
  }
  if (bits >= from) return null
  if (((acc << (to - bits)) & maxv) !== 0) return null
  return out
}

type Decoded = {
  kind: string
  network: string
  detail: string
  program?: string
}

function decodeBase58Address(address: string): Decoded {
  const bytes = base58Decode(address)
  if (bytes.length !== 25) throw new SourceError("base58 addresses are 25 bytes; this one has the wrong length")
  const payload = bytes.subarray(0, 21)
  const checksum = bytes.subarray(21)
  const expected = sha256(sha256(payload)).subarray(0, 4)
  if (!checksum.equals(expected)) throw new SourceError("the base58 checksum does not match — the address is mistyped or corrupted")
  const version = payload[0]
  const hash = payload.subarray(1).toString("hex")
  if (version === 0x00) return { kind: "P2PKH (pay to public key hash)", network: "mainnet", detail: `hash160 ${hash}`, program: hash }
  if (version === 0x05) return { kind: "P2SH (pay to script hash)", network: "mainnet", detail: `script hash ${hash}`, program: hash }
  if (version === 0x6f) return { kind: "P2PKH (pay to public key hash)", network: "testnet", detail: `hash160 ${hash}`, program: hash }
  if (version === 0xc4) return { kind: "P2SH (pay to script hash)", network: "testnet", detail: `script hash ${hash}`, program: hash }
  throw new SourceError(`unknown version byte 0x${version.toString(16).padStart(2, "0")}`)
}

function decodeBech32Address(address: string): Decoded {
  if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
    throw new SourceError("bech32 addresses cannot mix upper and lower case")
  }
  const text = address.toLowerCase()
  const separator = text.lastIndexOf("1")
  if (separator < 1 || separator + 7 > text.length) throw new SourceError("the bech32 separator is missing or misplaced")
  const hrp = text.slice(0, separator)
  const dataPart = text.slice(separator + 1)
  const data: number[] = []
  for (const ch of dataPart) {
    const value = BECH32_CHARS.indexOf(ch)
    if (value < 0) throw new SourceError(`"${ch}" is not a bech32 character`)
    data.push(value)
  }
  const checksum = bech32Polymod([...bech32HrpExpand(hrp), ...data])
  const networks: Record<string, string> = { bc: "mainnet", tb: "testnet", bcrt: "regtest" }
  if (!(hrp in networks)) throw new SourceError(`unknown bech32 prefix "${hrp}" (expected bc, tb or bcrt)`)
  const version = data[0]
  const constant = version === 0 ? 1 : 0x2bc830a3
  if (checksum !== constant) {
    throw new SourceError(version === 0 ? "the bech32 checksum does not match" : "the bech32m checksum does not match")
  }
  const program = convertBits(data.slice(1, -6), 5, 8)
  if (!program) throw new SourceError("the witness program has invalid padding")
  const hex = Buffer.from(program).toString("hex")
  if (version === 0) {
    if (program.length === 20) return { kind: "P2WPKH (segwit v0, witness public key hash)", network: networks[hrp], detail: `witness program ${hex}`, program: hex }
    if (program.length === 32) return { kind: "P2WSH (segwit v0, witness script hash)", network: networks[hrp], detail: `witness program ${hex}`, program: hex }
    throw new SourceError("segwit v0 programs must be 20 or 32 bytes")
  }
  if (version === 1 && program.length === 32) {
    return { kind: "P2TR (taproot, segwit v1)", network: networks[hrp], detail: `witness program ${hex}`, program: hex }
  }
  if (version > 16) throw new SourceError(`witness version ${version} is out of range (0-16)`)
  return { kind: `segwit v${version}`, network: networks[hrp], detail: `witness program ${hex}`, program: hex }
}

export async function validateBtcAddress(a: { address: string }): Promise<string> {
  const address = clean(a.address)
  if (!address) throw new SourceError("address is required")
  if (address.length > 100) throw new SourceError("address is far too long to be a Bitcoin address")
  const decoded = /^(bc|tb|bcrt)1/i.test(address) ? decodeBech32Address(address) : decodeBase58Address(address)
  return [
    `Valid address.`,
    "",
    bullet("type", decoded.kind),
    bullet("network", decoded.network),
    bullet("detail", decoded.detail),
    bullet("length", `${address.length} characters`),
  ]
    .filter(Boolean)
    .join("\n")
}

export async function derivationPathInfo(a: { path: string }): Promise<string> {
  const path = clean(a.path)
  if (!/^m(\/\d+'?)*$/.test(path)) throw new SourceError(`path must look like m/84'/0'/0'/0/1 (got "${a.path}")`)
  const parts = path.split("/").slice(1)
  const purposes: Record<string, string> = {
    "44": "BIP-44 legacy P2PKH addresses",
    "49": "BIP-49 P2SH-wrapped segwit",
    "84": "BIP-84 native segwit (bc1q...)",
    "86": "BIP-86 taproot (bc1p...)",
  }
  const coins: Record<string, string> = { "0": "Bitcoin mainnet", "1": "Bitcoin testnet" }
  const rows = parts.map((part, i) => {
    const hardened = part.endsWith("'")
    const value = Number(hardened ? part.slice(0, -1) : part)
    if (!Number.isInteger(value) || value < 0 || value >= 2 ** 31) throw new SourceError(`component ${i + 1} must be between 0 and 2^31-1`)
    const role =
      i === 0 && purposes[String(value)] ? purposes[String(value)] :
      i === 1 ? (coins[String(value)] ?? `coin type ${value}`) :
      i === 2 ? "account" :
      i === 3 ? (value === 0 ? "external chain (receiving)" : value === 1 ? "internal chain (change)" : `chain ${value}`) :
      i === 4 ? "address index" : `level ${i}`
    return `${String(i + 1).padStart(2)}. ${part.padEnd(6)} ${hardened ? "hardened" : "normal "}  ${role}`
  })
  return [
    `Derivation path ${path} (${parts.length} level(s), ${parts.filter((p) => p.endsWith("'")).length} hardened):`,
    "",
    ...rows,
    "",
    "Hardened levels use the key's private half, so a watch-only wallet cannot derive them.",
  ].join("\n")
}

export async function listAddressTypes(): Promise<string> {
  return [
    "Bitcoin address types this checker recognises:",
    "",
    "prefix          type                                  version / witness version",
    "1...            P2PKH legacy                          0x00 base58check",
    "3...            P2SH (often wrapped segwit)           0x05 base58check",
    "m... / n...     P2PKH testnet                         0x6f base58check",
    "2...            P2SH testnet                          0xc4 base58check",
    "bc1q...         P2WPKH / P2WSH                        witness v0, bech32",
    "bc1p...         P2TR taproot                          witness v1, bech32m",
    "tb1... / bcrt1  the same on testnet and regtest       bech32 / bech32m",
  ].join("\n")
}
