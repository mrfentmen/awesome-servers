/**
 * Nonogram — keyless local solver.
 */
const SOURCE = "Nonogram"

export class SourceError extends Error {}

function runs(line: number[]): number[] {
  const out: number[] = []
  let run = 0
  for (const v of line) {
    if (v === 1) run++
    else if (run) { out.push(run); run = 0 }
  }
  if (run) out.push(run)
  return out
}

function clues(line: number[]): number[] {
  const r = runs(line)
  return r.length ? r : [0]
}

function placements(clue: number[], len: number): number[][] {
  const out: number[][] = []
  const rec = (i: number, lastEnd: number, acc: number[]): void => {
    if (i === clue.length) {
      out.push([...acc, ...Array(len - lastEnd).fill(0)])
      return
    }
    const min = i === 0 ? 0 : lastEnd + 1
    const after = clue.slice(i + 1).reduce((t, v) => t + v, 0) + Math.max(0, clue.length - i - 2)
    for (let start = min; start + clue[i] + after <= len; start++) {
      rec(i + 1, start + clue[i], [...acc, ...Array(start - lastEnd).fill(0), ...Array(clue[i]).fill(1)])
    }
  }
  rec(0, 0, [])
  return out
}

/** Can this clue still be completed, given known cells (1 filled, 0 empty, -1 unknown)? */
function canMatch(cells: number[], clue: number[]): boolean {
  const blocks = clue.length === 1 && clue[0] === 0 ? [] : clue
  const rec = (cell: number, block: number): boolean => {
    if (block === blocks.length) {
      for (let i = cell; i < cells.length; i++) if (cells[i] === 1) return false
      return true
    }
    let p = cell
    while (p < cells.length && cells[p] === 0) p++
    if (p >= cells.length) return false
    const size = blocks[block]
    while (p + size <= cells.length) {
      let ok = true
      for (let k = 0; k < size; k++) if (cells[p + k] === 0) { ok = false; break }
      if (ok && (p + size === cells.length || cells[p + size] !== 1)) {
        let next = p + size
        if (next < cells.length) next++
        if (rec(next, block + 1)) return true
      }
      if (cells[p] === 1) return false
      p++
    }
    return false
  }
  return rec(0, 0)
}

function validateClues(clue: number[], len: number, label: string): number[] {
  const v = clue.map((n) => {
    if (!Number.isInteger(n) || n < 0) throw new SourceError(`${label} clues must be non-negative integers`)
    return n
  })
  if (v.length === 1 && v[0] === 0) return [0]
  if (v.includes(0)) throw new SourceError(`${label} clue cannot mix 0 with other counts`)
  if (v.reduce((t, n) => t + n, 0) + Math.max(0, v.length - 1) > len) throw new SourceError(`${label} clue does not fit a line of ${len}`)
  return v.length ? v : [0]
}

function parseGrid(grid: string[]): number[][] {
  if (!grid.length) throw new SourceError("grid is empty")
  const w = Math.max(...grid.map((r) => r.length))
  if (grid.some((r) => r.length !== w)) throw new SourceError("all grid rows must be the same length")
  if (grid.length * w > 10000) throw new SourceError("grid is too large")
  return grid.map((r) => r.split("").map((ch) => (ch === "#" || ch === "1" || ch === "X" ? 1 : 0)))
}

export async function solveNonogram(a: { rows: number[][]; cols: number[][] }): Promise<string> {
  const h = a.rows.length
  const w = a.cols.length
  if (h < 1 || w < 1) throw new SourceError("puzzle needs at least one row and one column")
  if (h * w > 225) throw new SourceError("puzzles up to 15x15 are supported")
  const rowClues = a.rows.map((c, i) => validateClues(c, w, `row ${i + 1}`))
  const colClues = a.cols.map((c, i) => validateClues(c, h, `column ${i + 1}`))
  const rowOpts = rowClues.map((c) => placements(c, w))
  if (rowOpts.some((o) => o.length === 0)) throw new SourceError("a row clue has no valid placement")
  const grid: number[][] = Array.from({ length: h }, () => Array(w).fill(-1))
  let steps = 0

  const columnsOk = (depth: number): boolean => {
    for (let c = 0; c < w; c++) {
      const col: number[] = []
      for (let y = 0; y <= depth; y++) col.push(grid[y][c])
      for (let y = depth + 1; y < h; y++) col.push(-1)
      if (!canMatch(col, colClues[c])) return false
    }
    return true
  }

  const dfs = (row: number): boolean => {
    if (row === h) return true
    for (const opt of rowOpts[row]) {
      grid[row] = [...opt]
      steps++
      if (steps > 500000) throw new SourceError("puzzle needs more search than allowed (it may be ambiguous or unsolvable)")
      if (columnsOk(row) && dfs(row + 1)) return true
    }
    grid[row] = Array(w).fill(-1)
    return false
  }

  if (!dfs(0)) throw new SourceError("no solution exists for these clues")
  const picture = grid.map((r) => r.map((v) => (v === 1 ? "##" : "  ")).join(""))
  return [`Solved ${h}x${w} nonogram:`, ...picture.map((r) => `|${r}|`)].join("\n")
}

export async function checkNonogram(a: { grid: string[]; rows: number[][]; cols: number[][] }): Promise<string> {
  const g = parseGrid(a.grid)
  const badRows: string[] = []
  const badCols: string[] = []
  if (a.rows.length !== g.length) throw new SourceError(`grid has ${g.length} rows but ${a.rows.length} row clues`)
  if (a.cols.length !== g[0].length) throw new SourceError(`grid has ${g[0].length} columns but ${a.cols.length} column clues`)
  a.rows.forEach((clue, i) => {
    const got = clues(g[i])
    if (got.join(",") !== (clue.length ? clue.join(",") : "0")) badRows.push(`row ${i + 1}: expected ${clue.join(",")} got ${got.join(",")}`)
  })
  for (let c = 0; c < g[0].length; c++) {
    const got = clues(g.map((r) => r[c]))
    const want = a.cols[c]
    if (got.join(",") !== (want.length ? want.join(",") : "0")) badCols.push(`column ${c + 1}: expected ${want.join(",")} got ${got.join(",")}`)
  }
  const problems = [...badRows, ...badCols]
  return problems.length === 0 ? `Valid nonogram: ${g.length}x${g[0].length}, every row and column matches.` : [`${problems.length} mismatches:`, ...problems].join("\n")
}

export async function cluesFromGrid(a: { grid: string[] }): Promise<string> {
  const g = parseGrid(a.grid)
  const rows = g.map(clues)
  const cols: number[][] = []
  for (let c = 0; c < g[0].length; c++) cols.push(clues(g.map((r) => r[c])))
  return [
    `Rows (${g.length}): ${rows.map((r) => `[${r.join(",")}]`).join(" ")}`,
    `Columns (${g[0].length}): ${cols.map((r) => `[${r.join(",")}]`).join(" ")}`,
  ].join("\n")
}
