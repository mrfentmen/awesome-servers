export class CsvError extends Error {}

function parseCsvText(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ",") {
      row.push(field); field = ""
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = ""
    } else if (c !== "\r") {
      field += c
    }
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}

export async function parseCsv(args: { csv?: string; max_rows?: number }): Promise<string> {
  const input = args.csv ?? ""
  if (!input.trim()) throw new CsvError("Provide CSV text")
  const rows = parseCsvText(input)
  if (rows.length === 0) throw new CsvError("No rows found")
  const max = Math.min(args.max_rows ?? 30, 100)
  const widths = rows[0].map((_, i) => Math.max(...rows.slice(0, max + 1).map((r) => String(r[i] ?? "").length)))
  const fmt = (r: string[]) => r.map((c, i) => String(c).padEnd(widths[i])).join(" | ").trimEnd()
  const out = rows.slice(0, max + 1).map(fmt)
  if (rows.length > max + 1) out.push(`... ${rows.length - max - 1} more rows`)
  return out.join("\n")
}

export async function csvInfo(args: { csv?: string }): Promise<string> {
  const input = args.csv ?? ""
  const rows = parseCsvText(input)
  if (rows.length === 0) throw new CsvError("No rows found")
  return `Columns (${rows[0].length}): ${rows[0].map((c, i) => `${i}:${c}`).join(", ")}\nData rows: ${rows.length - 1}`
}

// ---- muxA tools:

