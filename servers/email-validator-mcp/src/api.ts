import { promises as dns } from "node:dns"

export class EmailError extends Error {}

const DISPOSABLE = new Set([
  "mailinator.com", "10minutemail.com", "guerrillamail.com", "sharklasers.com",
  "yopmail.com", "tempmail.com", "throwawaymail.com", "maildrop.cc", "temp-mail.org",
  "getnada.com", "dispostable.com", "mohmal.com", "emailondeck.com", "burnermail.io",
  "trashmail.com", "spam4.me", "fakeinbox.com", "mailnesia.com", "mintemail.com",
])

interface Result {
  email: string
  format: string
  mx_hosts: string[]
  disposable: boolean
  deliverable: string
}

async function checkOne(email: string): Promise<Result> {
  const parts = email.split("@")
  const result: Result = {
    email,
    format: parts.length !== 2 || !parts[0] || !/^[^\s@]+$/.test(parts[0]) ? "invalid" : "valid",
    mx_hosts: [],
    disposable: DISPOSABLE.has((parts[1] ?? "").toLowerCase()),
    deliverable: "unknown",
  }
  if (result.format === "invalid") {
    result.deliverable = "not checked"
    return result
  }
  try {
    const hosts = await dns.resolveMx(parts[1])
    result.mx_hosts = hosts.sort((a, b) => a.priority - b.priority).map((h) => h.exchange)
    result.deliverable = result.mx_hosts.length > 0 ? "likely" : "no MX record"
  } catch {
    result.deliverable = "no MX record or domain not found"
  }
  return result
}

function fmt(r: Result): string {
  const flags = [r.format === "invalid" ? "INVALID FORMAT" : null, r.disposable ? "DISPOSABLE" : null].filter(Boolean)
  return `${r.email}\n  Format: ${r.format}\n  MX: ${r.mx_hosts.slice(0, 5).join(", ") || "none"}\n  Deliverable: ${r.deliverable}${flags.length ? ` | ${flags.join(" | ")}` : ""}`
}

export async function validateEmail(args: { email?: string }): Promise<string> {
  const email = (args.email ?? "").trim()
  if (!email) throw new EmailError("Provide an email address")
  return fmt(await checkOne(email))
}

export async function validateBatch(args: { emails?: string }): Promise<string> {
  const list = (args.emails ?? "").split(",").map((e) => e.trim()).filter(Boolean)
  if (list.length === 0) throw new EmailError("Provide at least one email address")
  const results = await Promise.all(list.slice(0, 25).map(checkOne))
  return results.map(fmt).join("\n\n")
}
