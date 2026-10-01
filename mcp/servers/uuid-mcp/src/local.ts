import { randomUUID } from "node:crypto"

export async function generateUuid(_args: Record<string, never>): Promise<string> {
  return randomUUID()
}

export async function generateMany(args: { count?: number }): Promise<string> {
  const n = Math.min(Math.max(args.count ?? 5, 1), 100)
  return Array.from({ length: n }, () => randomUUID()).join("\n")
}

