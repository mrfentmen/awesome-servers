const UA = "mrfentmen-sudoku-mcp/1.0"
export class SudokuError extends Error {}

function blank(): number[] {
  return new Array(81).fill(0)
}

function valid(grid: number[], r: number, c: number, n: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[r * 9 + i] === n) return false
    if (grid[i * 9 + c] === n) return false
  }
  const br = Math.floor(r / 3) * 3
  const bc = Math.floor(c / 3) * 3
  for (let i = br; i < br + 3; i++) {
    for (let j = bc; j < bc + 3; j++) {
      if (grid[i * 9 + j] === n) return false
    }
  }
  return true
}

function backtrack(grid: number[]): boolean {
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) {
      for (let n = 1; n <= 9; n++) {
        if (valid(grid, Math.floor(i / 9), i % 9, n)) {
          grid[i] = n
          if (backtrack(grid)) return true
          grid[i] = 0
        }
      }
      return false
    }
  }
  return true
}

function countSolutions(grid: number[], limit = 2): number {
  let count = 0
  const rec = (g: number[]): void => {
    if (count >= limit) return
    let idx = -1
    for (let i = 0; i < 81; i++) { if (g[i] === 0) { idx = i; break } }
    if (idx === -1) { count++; return }
    for (let n = 1; n <= 9; n++) {
      if (valid(g, Math.floor(idx / 9), idx % 9, n)) {
        g[idx] = n
        rec(g)
        g[idx] = 0
      }
    }
  }
  rec(grid)
  return count
}

const DIFF_HOLES: Record<string, number> = { easy: 36, medium: 45, hard: 52, expert: 58 }

export async function generate(args: { difficulty?: string }): Promise<string> {
  const difficulty = (args.difficulty ?? "easy").toLowerCase()
  const holes = DIFF_HOLES[difficulty]
  if (holes === undefined) throw new SudokuError("Difficulty must be easy, medium, hard, or expert")
  const full = blank()
  backtrack(full)
  const puzzle = full.slice()
  const positions = [...Array(81).keys()].sort(() => Math.random() - 0.5)
  let removed = 0
  for (const pos of positions) {
    if (removed >= holes) break
    const backup = puzzle[pos]
    puzzle[pos] = 0
    if (countSolutions(puzzle.slice()) !== 1) puzzle[pos] = backup
    else removed++
  }
  return `Sudoku ${difficulty} (${removed} clues removed):\n${gridToText(puzzle)}`
}

function gridToText(grid: number[]): string {
  const rows: string[] = []
  for (let r = 0; r < 9; r++) {
    const cells = grid.slice(r * 9, r * 9 + 9).map((n) => (n === 0 ? "." : String(n)))
    rows.push(cells.join(" "))
  }
  return rows.join("\n")
}

export async function solve(args: { grid?: string }): Promise<string> {
  const raw = (args.grid ?? "").trim().replace(/[^0-9.]/g, "")
  if (raw.length !== 81) throw new SudokuError("Provide 81 digits, 0 or . for empty cells")
  const grid = raw.split("").map((c) => (c === "." ? 0 : Number(c)))
  if (!backtrack(grid)) throw new SudokuError("Puzzle has no solution")
  return `Solved:\n${gridToText(grid)}`
}

// ---- muxC tools:

