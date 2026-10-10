import { jwtVerify, decodeJwt, decodeProtectedHeader } from "jose"

export class JwtError extends Error {}

function parts(token: string): string[] {
  const p = token.split(".")
  if (p.length !== 3) throw new JwtError("Not a JWT. Expected three dot separated parts")
  return p
}

export async function decode(args: { token?: string }): Promise<string> {
  const token = (args.token ?? "").trim()
  if (!token) throw new JwtError("Provide a JWT")
  parts(token)
  const payload = decodeJwt(token)
  const header = decodeProtectedHeader(token)
  return `Header: ${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}`
}

export async function verify(args: { token?: string; secret?: string }): Promise<string> {
  const token = (args.token ?? "").trim()
  const secret = (args.secret ?? "")
  if (!token || !secret) throw new JwtError("Provide both a JWT and an HMAC secret")
  parts(token)
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return `Signature: VALID\n\nPayload:\n${JSON.stringify(payload, null, 2)}`
  } catch (e) {
    throw new JwtError(`Signature INVALID: ${e instanceof Error ? e.message : String(e)}`)
  }
}

// ---- muxB tools:

type Jwk = { kid?: string; kty?: string; alg?: string; use?: string; crv?: string; x5c?: string[] }

