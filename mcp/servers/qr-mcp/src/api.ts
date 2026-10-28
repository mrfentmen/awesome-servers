/**
 * QR Codes — keyless public API client.
 */

export class SourceError extends Error {}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

const ECL_BITS: Record<string, number> = { L: 1, M: 0, Q: 3, H: 2 }

// Block layout from ISO 18004 table 9, versions 1-9:
// [blockCount, totalCodewordsPerBlock, dataCodewordsPerBlock]
const RS_BLOCKS: Record<number, Record<string, Array<[number, number, number]>>> = {
  1: { L: [[1, 26, 19]], M: [[1, 26, 16]], Q: [[1, 26, 13]], H: [[1, 26, 9]] },
  2: { L: [[1, 44, 34]], M: [[1, 44, 28]], Q: [[1, 44, 22]], H: [[1, 44, 16]] },
  3: { L: [[1, 70, 55]], M: [[1, 70, 44]], Q: [[2, 35, 17]], H: [[2, 35, 13]] },
  4: { L: [[1, 100, 80]], M: [[2, 50, 32]], Q: [[2, 50, 24]], H: [[4, 25, 9]] },
  5: { L: [[1, 134, 108]], M: [[2, 67, 43]], Q: [[2, 33, 15], [2, 34, 16]], H: [[2, 33, 11], [2, 34, 12]] },
  6: { L: [[2, 86, 68]], M: [[4, 43, 27]], Q: [[4, 43, 19]], H: [[4, 43, 15]] },
  7: { L: [[2, 98, 78]], M: [[4, 49, 31]], Q: [[2, 32, 14], [4, 33, 15]], H: [[4, 39, 13], [1, 40, 14]] },
  8: { L: [[2, 121, 97]], M: [[2, 60, 38], [2, 61, 39]], Q: [[4, 40, 18], [2, 41, 19]], H: [[4, 40, 14], [2, 41, 15]] },
  9: { L: [[2, 146, 116]], M: [[3, 58, 36], [2, 59, 37]], Q: [[4, 36, 16], [4, 37, 17]], H: [[4, 36, 12], [4, 37, 13]] },
}

const ALIGNMENT: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
}

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]
}

function rsEncode(data: number[], ecLength: number): number[] {
  let gen: number[] = [1]
  for (let i = 0; i < ecLength; i++) {
    const next = new Array(gen.length + 1).fill(0)
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j]
      next[j + 1] ^= gfMul(gen[j], EXP[i])
    }
    gen = next
  }
  const res = data.concat(new Array(ecLength).fill(0))
  for (let i = 0; i < data.length; i++) {
    const factor = res[i]
    if (factor === 0) continue
    for (let j = 0; j < gen.length; j++) res[i + j] = res[i + j] ^ gfMul(gen[j], factor)
  }
  return res.slice(data.length)
}

function formatBits(ecl: string, mask: number): number {
  const data = (ECL_BITS[ecl] << 3) | mask
  let rem = data << 10
  while (bitLength(rem) - 11 >= 0) rem ^= 0x537 << (bitLength(rem) - 11)
  return ((data << 10) | rem) ^ 0x5412
}

function versionBits(version: number): number {
  let rem = version << 12
  while (bitLength(rem) - 13 >= 0) rem ^= 0x1f25 << (bitLength(rem) - 13)
  return (version << 12) | rem
}

function bitLength(value: number): number {
  let length = 0
  while (value) {
    length++
    value >>>= 1
  }
  return length
}

function dataCodewords(version: number, ecl: string): number {
  return RS_BLOCKS[version][ecl].reduce((sum, [count, , data]) => sum + count * data, 0)
}

function pickVersion(byteLength: number, ecl: string, wanted?: number): number {
  const neededBits = 4 + 8 + byteLength * 8
  for (let version = wanted ?? 1; version <= 9; version++) {
    if (dataCodewords(version, ecl) * 8 >= neededBits) return wanted ? (dataCodewords(version, ecl) * 8 >= neededBits ? version : -1) : version
  }
  return -1
}

function encodeData(text: string, version: number, ecl: string): number[] {
  const bytes = Buffer.from(text, "utf8")
  const capacity = dataCodewords(version, ecl)
  const bits: number[] = []
  const pushBits = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1)
  }
  pushBits(0b0100, 4)
  pushBits(bytes.length, 8)
  for (const byte of bytes) pushBits(byte, 8)
  const capacityBits = capacity * 8
  if (bits.length > capacityBits) throw new SourceError("the text is too long for the selected version and error level")
  for (let i = 0; i < 4 && bits.length < capacityBits; i++) bits.push(0)
  while (bits.length % 8 !== 0) bits.push(0)
  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j]
    codewords.push(byte)
  }
  const pad = [0xec, 0x11]
  let padIndex = 0
  while (codewords.length < capacity) {
    codewords.push(pad[padIndex % 2])
    padIndex++
  }
  void version
  return codewords
}

function interleave(codewords: number[], version: number, ecl: string): number[] {
  const blocks: Array<{ data: number[]; ec: number[] }> = []
  let offset = 0
  for (const [count, total, dataLength] of RS_BLOCKS[version][ecl]) {
    for (let i = 0; i < count; i++) {
      const data = codewords.slice(offset, offset + dataLength)
      offset += dataLength
      blocks.push({ data, ec: rsEncode(data, total - dataLength) })
    }
  }
  const out: number[] = []
  const maxData = Math.max(...blocks.map((b) => b.data.length))
  for (let i = 0; i < maxData; i++) {
    for (const block of blocks) if (i < block.data.length) out.push(block.data[i])
  }
  const maxEc = Math.max(...blocks.map((b) => b.ec.length))
  for (let i = 0; i < maxEc; i++) {
    for (const block of blocks) if (i < block.ec.length) out.push(block.ec[i])
  }
  return out
}

type Grid = { size: number; cells: Int8Array }

function buildGrid(version: number, ecl: string, mask: number, codewords: number[]): Grid {
  const size = version * 4 + 17
  const grid = new Int8Array(size * size).fill(-1)
  const set = (row: number, col: number, value: number) => {
    if (row >= 0 && row < size && col >= 0 && col < size) grid[row * size + col] = value
  }
  const get = (row: number, col: number) => grid[row * size + col]
  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6
        const dark = inside && ((r === 0 || r === 6 || c === 0 || c === 6) || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
        set(row + r, col + c, dark ? 1 : 0)
      }
    }
  }
  placeFinder(0, 0)
  placeFinder(0, size - 7)
  placeFinder(size - 7, 0)
  for (let i = 8; i < size - 8; i++) {
    const dark = i % 2 === 0 ? 1 : 0
    if (get(6, i) === -1) set(6, i, dark)
    if (get(i, 6) === -1) set(i, 6, dark)
  }
  const centers = ALIGNMENT[version]
  for (const row of centers) {
    for (const col of centers) {
      if (get(row, col) !== -1) continue
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const dark = Math.max(Math.abs(r), Math.abs(c)) !== 1
          set(row + r, col + c, dark ? 1 : 0)
        }
      }
    }
  }
  // Reserve format info areas and the dark module.
  for (let i = 0; i <= 8; i++) {
    if (get(8, i) === -1) set(8, i, 0)
    if (get(i, 8) === -1) set(i, 8, 0)
  }
  for (let i = 0; i < 8; i++) {
    if (get(8, size - 1 - i) === -1) set(8, size - 1 - i, 0)
    if (get(size - 1 - i, 8) === -1) set(size - 1 - i, 8, 0)
  }
  set(size - 8, 8, 1)
  // Version info for 7 and up.
  if (version >= 7) {
    const bits = versionBits(version)
    for (let i = 0; i < 18; i++) {
      const bit = (bits >> i) & 1
      const row = Math.floor(i / 3)
      const col = i % 3
      set(row, size - 11 + col, bit)
      set(size - 11 + col, row, bit)
    }
  }
  // Data placement: two-column zigzag, upwards and downwards.
  const maskFn = (row: number, col: number): boolean => {
    switch (mask) {
      case 0: return (row + col) % 2 === 0
      case 1: return row % 2 === 0
      case 2: return col % 3 === 0
      case 3: return (row + col) % 3 === 0
      case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0
      case 5: return ((row * col) % 2) + ((row * col) % 3) === 0
      case 6: return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0
      case 7: return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0
      default: throw new SourceError("mask must be between 0 and 7")
    }
  }
  let bitIndex = 0
  const totalBits = codewords.length * 8
  const readBit = (): number => {
    if (bitIndex >= totalBits) return 0
    const byte = codewords[bitIndex >> 3]
    const bit = (byte >> (7 - (bitIndex & 7))) & 1
    bitIndex++
    return bit
  }
  let upward = true
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i
      for (const c of [col, col - 1]) {
        if (get(row, c) !== -1) continue
        const bit = readBit()
        set(row, c, maskFn(row, c) ? bit ^ 1 : bit)
      }
    }
    upward = !upward
  }
  // Format information, written twice.
  const format = formatBits(ecl, mask)
  // Copy 1, around the top-left finder.
  for (let i = 0; i <= 5; i++) set(8, i, (format >> (14 - i)) & 1)
  set(8, 7, (format >> 8) & 1)
  set(8, 8, (format >> 7) & 1)
  set(7, 8, (format >> 6) & 1)
  for (let i = 0; i <= 5; i++) set(5 - i, 8, (format >> (5 - i)) & 1)
  // Copy 2, split between the bottom-left and top-right corners.
  for (let i = 0; i < 8; i++) set(8, size - 1 - i, (format >> i) & 1)
  for (let i = 0; i < 7; i++) set(size - 7 + i, 8, (format >> (8 + i)) & 1)
  set(size - 8, 8, 1)
  return { size, cells: grid }
}

function penalty(grid: Grid): number {
  const { size, cells } = grid
  const at = (row: number, col: number) => cells[row * size + col]
  let score = 0
  // Rule 1: runs of five or more.
  for (let i = 0; i < size; i++) {
    for (const [dr, dc] of [[0, 1], [1, 0]] as Array<[number, number]>) {
      let run = 1
      let previous = -1
      for (let j = 0; j < size; j++) {
        const row = dr === 0 ? i : j
        const col = dc === 0 ? i : j
        const value = at(row, col)
        if (value === previous) run++
        else {
          if (run >= 5) score += 3 + (run - 5)
          run = 1
          previous = value
        }
      }
      if (run >= 5) score += 3 + (run - 5)
    }
  }
  // Rule 2: 2x2 blocks.
  for (let row = 0; row < size - 1; row++) {
    for (let col = 0; col < size - 1; col++) {
      const value = at(row, col)
      if (value === at(row, col + 1) && value === at(row + 1, col) && value === at(row + 1, col + 1)) score += 3
    }
  }
  // Rule 3: finder-like patterns with four light modules on one side.
  const patterns = ["10111010000", "00001011101"]
  for (let i = 0; i < size; i++) {
    for (let j = 0; j + 11 <= size; j++) {
      const rowBits: string[] = []
      const colBits: string[] = []
      for (let k = 0; k < 11; k++) {
        rowBits.push(String(at(i, j + k)))
        colBits.push(String(at(j + k, i)))
      }
      const rowText = rowBits.join("")
      const colText = colBits.join("")
      for (const pattern of patterns) {
        if (rowText === pattern) score += 40
        if (colText === pattern) score += 40
      }
    }
  }
  // Rule 4: dark proportion.
  let dark = 0
  for (let i = 0; i < cells.length; i++) if (cells[i] === 1) dark++
  const percent = (dark * 100) / cells.length
  score += Math.floor(Math.abs(percent - 50) / 5) * 10
  return score
}

function render(text: string, ecl: string, version: number | undefined, mask: number | undefined): Grid {
  const bytes = Buffer.from(text, "utf8")
  const chosen = pickVersion(bytes.length, ecl, version)
  if (chosen < 0) {
    throw new SourceError(
      version
        ? `that text does not fit in version ${version} at error level ${ecl}`
        : "the text is too long (versions 1-9 at level L hold 230 bytes)"
    )
  }
  const codewords = interleave(encodeData(text, chosen, ecl), chosen, ecl)
  if (mask !== undefined) return buildGrid(chosen, ecl, mask, codewords)
  let best: { grid: Grid; score: number } | null = null
  for (let m = 0; m < 8; m++) {
    const grid = buildGrid(chosen, ecl, m, codewords)
    const score = penalty(grid)
    if (!best || score < best.score) best = { grid, score }
  }
  return best!.grid
}

export async function qrMatrix(a: { text: string; ecl?: string; version?: number; mask?: number }): Promise<string> {
  const text = String(a.text ?? "")
  if (!text) throw new SourceError("text is required")
  if (Buffer.byteLength(text, "utf8") > 230) throw new SourceError("the text is capped at 230 bytes (QR version 9-L)")
  const ecl = (clean(a.ecl) || "M").toUpperCase()
  if (!["L", "M", "Q", "H"].includes(ecl)) throw new SourceError("ecl must be L, M, Q or H")
  if (a.version !== undefined && (a.version < 1 || a.version > 9 || !Number.isInteger(a.version))) {
    throw new SourceError("version must be between 1 and 9")
  }
  if (a.mask !== undefined && (a.mask < 0 || a.mask > 7 || !Number.isInteger(a.mask))) {
    throw new SourceError("mask must be between 0 and 7")
  }
  const grid = render(text, ecl, a.version, a.mask)
  const rows: string[] = []
  for (let row = 0; row < grid.size; row++) {
    let line = ""
    for (let col = 0; col < grid.size; col++) line += grid.cells[row * grid.size + col] === 1 ? "1" : "0"
    rows.push(line)
  }
  return [
    `${grid.size}x${grid.size} QR matrix · error level ${ecl}${a.mask === undefined ? " · best mask" : ` · mask ${a.mask}`} · ${Buffer.byteLength(text, "utf8")} byte(s)`,
    "",
    ...rows,
  ].join("\n")
}

export async function qrAscii(a: { text: string; ecl?: string; version?: number; invert?: boolean }): Promise<string> {
  const text = String(a.text ?? "")
  if (!text) throw new SourceError("text is required")
  if (Buffer.byteLength(text, "utf8") > 230) throw new SourceError("the text is capped at 230 bytes (QR version 9-L)")
  const ecl = (clean(a.ecl) || "M").toUpperCase()
  if (!["L", "M", "Q", "H"].includes(ecl)) throw new SourceError("ecl must be L, M, Q or H")
  const grid = render(text, ecl, a.version, undefined)
  const dark = "██"
  const light = "  "
  const lines: string[] = []
  const quiet = "  ".repeat(grid.size + 4)
  lines.push(quiet, quiet)
  for (let row = 0; row < grid.size; row++) {
    let line = "  "
    line += "  "
    for (let col = 0; col < grid.size; col++) {
      const value = grid.cells[row * grid.size + col] === 1
      line += (a.invert ? !value : value) ? dark : light
    }
    lines.push(line)
  }
  lines.push(quiet, quiet)
  return lines.join("\n")
}

export async function qrSvg(a: { text: string; ecl?: string; version?: number; scale?: number; margin?: number }): Promise<string> {
  const text = String(a.text ?? "")
  if (!text) throw new SourceError("text is required")
  if (Buffer.byteLength(text, "utf8") > 230) throw new SourceError("the text is capped at 230 bytes (QR version 9-L)")
  const ecl = (clean(a.ecl) || "M").toUpperCase()
  if (!["L", "M", "Q", "H"].includes(ecl)) throw new SourceError("ecl must be L, M, Q or H")
  const scale = Math.floor(a.scale ?? 8)
  if (!Number.isInteger(scale) || scale < 1 || scale > 64) throw new SourceError("scale must be between 1 and 64")
  const margin = Math.floor(a.margin ?? 4)
  if (!Number.isInteger(margin) || margin < 0 || margin > 16) throw new SourceError("margin must be between 0 and 16 modules")
  const grid = render(text, ecl, a.version, undefined)
  const total = (grid.size + margin * 2) * scale
  const rects: string[] = []
  for (let row = 0; row < grid.size; row++) {
    for (let col = 0; col < grid.size; col++) {
      if (grid.cells[row * grid.size + col] !== 1) continue
      rects.push(`<rect x="${(col + margin) * scale}" y="${(row + margin) * scale}" width="${scale}" height="${scale}"/>`)
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#ffffff"/><g fill="#000000">${rects.join("")}</g></svg>`
  return [
    `SVG QR code (${grid.size}x${grid.size} modules, ${Buffer.byteLength(text, "utf8")} byte(s), ${svg.length} characters):`,
    "",
    svg,
  ].join("\n")
}
