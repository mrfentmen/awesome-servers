import { randomUUID } from "node:crypto"

export class UuidError extends Error {}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function generateUuid(_args: Record<string, never>): Promise<string> {
  return randomUUID()
}

export async function generateMany(args: { count?: number }): Promise<string> {
  const n = Math.min(Math.max(args.count ?? 5, 1), 100)
  return Array.from({ length: n }, () => randomUUID()).join("\n")
}

export async function validateUuid(args: { uuid?: string }): Promise<string> {
  const u = (args.uuid ?? "").trim()
  if (!u) throw new UuidError("Provide a UUID string")
  return UUID_RE.test(u) ? `${u} is a valid UUID` : `${u} is not a valid UUID`
}

// ---- muxC tools:

const NIL_UUID = "00000000-0000-0000-0000-000000000000"
const MAX_UUID = "ffffffff-ffff-ffff-ffff-ffffffffffff"

/**
 * A UUID encodes more than its uniqueness: the version nibble says which RFC
 * made it, the variant bits say how the string should be parsed, and a version 1
 * UUID carries the MAC address and a 60-bit timestamp of the machine that minted
 * it.
 */
export async function uuidInfo(args: { uuid?: string }): Promise<string> {
  const raw = (args.uuid ?? "").trim().toLowerCase()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(raw)) {
    throw new UuidError("Provide a UUID in the form 8-4-4-4-12 hexadecimal digits")
  }
  const version = Number(raw[14])
  const variantBits = raw[19]
  const variant =
    variantBits === "8" || variantBits === "9" || variantBits === "a" || variantBits === "b"
      ? "RFC 4122 (10xx)"
      : variantBits === "c" || variantBits === "d" || variantBits === "e" || variantBits === "f"
        ? "reserved (110x, Microsoft COM/DCE)"
        : variantBits === "0" || variantBits === "1" || variantBits === "2" || variantBits === "3"
          ? "reserved NCS (0xx)"
          : "reserved (110x)"
  const meanings: Record<number, string> = {
    1: "time-based, RFC 4122 version 1 (date and MAC address)",
    2: "DCE Security version 2 (rare)",
    3: "name-based MD5, RFC 4122 version 3",
    4: "random, RFC 4122 version 4 (this is what Node's randomUUID emits)",
    5: "name-based SHA-1, RFC 4122 version 5",
    6: "reordered time, RFC 9562 version 6",
    7: "Unix time order, RFC 9562 version 7",
    8: "custom, RFC 9562 version 8",
  }
  const lines = [
    `UUID: ${raw}`,
    `Version: ${version} - ${meanings[version] ?? "not a version this server recognises"}`,
    `Variant: ${variant}`,
  ]
  if (raw === NIL_UUID) lines.push("This is the nil UUID, which every value equals.")
  if (raw === MAX_UUID) lines.push("This is the max UUID, which is greater than every other value.")
  if (version === 1) {
    // With the hyphens gone the 32 hex digits are time_low (8), time_mid (4),
    // time_hi_and_version (4, of which the low 3 are the top of the timestamp),
    // clock_seq (4) and the 12-digit node MAC. The 60-bit timestamp is
    // time_hi[low 12] || time_mid || time_low.
    const h = raw.replace(/-/g, "")
    const ticks = BigInt(`0x${h.slice(13, 16)}${h.slice(8, 12)}${h.slice(0, 8)}`)
    // Each tick is 100 ns, so ticks / 10000 gives milliseconds. The Gregorian
    // epoch of 1582-10-15 is itself -12219292800000 ms from the Unix epoch.
    const epochMs = -12219292800000n
    const when = new Date(Number(epochMs + ticks / 10000n))
    const clockSeq = h.slice(16, 20)
    lines.push(
      `Time: ${Number.isNaN(when.getTime()) ? "not computable" : when.toISOString()} (60-bit timestamp of 100 ns ticks since 1582-10-15)`,
      `Clock sequence: ${clockSeq} | node identifier (MAC): ${(h.slice(20).match(/../g) ?? []).join(":")}`,
    )
  }
  if (version === 3 || version === 5) {
    lines.push("Name-based UUIDs are deterministic: the same name always hashes to the same UUID.")
  }
  return lines.join("\n")
}
