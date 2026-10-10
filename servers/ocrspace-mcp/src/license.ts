// Premium tools on this server need a license key bought from MCP Marketplace.
// Buyers put the key in their MCP client config as MCP_LICENSE_KEY. Every tool
// that is not listed in PREMIUM keeps working without a key.
const SLUG = "ocrspace-mcp"

// Tools that need a key. Everything else is free.
const PREMIUM = new Set<string>([
  "ocr_cleanup",
  "document_fields",
])

const BUY_URL = `https://mcp-marketplace.io/server/io-github-mrfentmen-${SLUG}`

// The license check calls the marketplace's verify endpoint directly instead of
// using @mcp_marketplace/license. That SDK sends no `apikey` header, so every
// check it makes is rejected by Supabase before it reaches the function. The
// publishable key below is public by design - it ships in mcp-marketplace.io's
// own JavaScript and only ever reaches their licence check.
const DEFAULT_VERIFY_URL = "https://virupvwhtkpkjsiskckg.supabase.co/functions/v1/verify-key"
const PUBLISHABLE_KEY = "sb_publishable_BuqlW96Ke8C_zzJG-LQv1Q_YHi_r_4h"

const OK_CACHE_MS = 60 * 60 * 1000
const BAD_CACHE_MS = 60 * 1000

type Check = { valid: boolean; reason?: string }

const seen = new Map<string, Check & { at: number }>()

const REASONS: Record<string, string> = {
  missing_key: "no key is set",
  invalid_format: "that key is not a valid MCP Marketplace key",
  not_found: "that key was not found",
  revoked: "that key has been revoked",
  rotated: "that key was rotated, use your new one",
  expired: "that key has expired, renew it",
  rate_limited: "there were too many checks just now, try again shortly",
  network_error: "the license server could not be reached",
}

function blocked(tool: string, reason: string): string {
  const why = REASONS[reason] ?? `the license server answered "${reason}"`
  return `"${tool}" needs a license key, but ${why}. ` +
    `Set MCP_LICENSE_KEY in your MCP client config. Get a key: ${BUY_URL}`
}

async function verify(key: string): Promise<Check> {
  const res = await fetch(process.env.MCP_LICENSE_VERIFY_URL || DEFAULT_VERIFY_URL, {
    method: "POST",
    headers: {
      apikey: PUBLISHABLE_KEY,
      Authorization: `Bearer ${PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key, slug: SLUG }),
    // an unusable key answers 400 with a JSON body, so read the body either way
    signal: AbortSignal.timeout(15000),
  })
  const data = (await res.json()) as Check
  if (typeof data?.valid !== "boolean") return { valid: false, reason: "unexpected_response" }
  return data
}

/**
 * Returns null when the caller may run the tool, or a short message telling
 * them how to get a key.
 *
 * A good key is remembered for an hour, so a busy session does not hit the
 * license server on every call and keeps working through a brief outage.
 */
export async function premiumRequired(tool: string): Promise<string | null> {
  if (!PREMIUM.has(tool)) return null

  const key = process.env.MCP_LICENSE_KEY
  if (!key) return blocked(tool, "missing_key")

  const hit = seen.get(key)
  if (hit && Date.now() - hit.at < (hit.valid ? OK_CACHE_MS : BAD_CACHE_MS)) {
    return hit.valid ? null : blocked(tool, hit.reason ?? "invalid")
  }

  let result: Check
  try {
    result = await verify(key)
  } catch {
    result = { valid: false, reason: "network_error" }
  }
  seen.set(key, { ...result, at: Date.now() })
  return result.valid ? null : blocked(tool, result.reason ?? "invalid")
}
