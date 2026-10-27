/**
 * Maze — keyless public API client.
 */
const BASE = "https://example.invalid";
const SOURCE = "Maze";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "maze-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
function rng(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}
function build(width, height, seed) {
    const w = width * 2 + 1;
    const h = height * 2 + 1;
    const grid = Array.from({ length: h }, () => Array(w).fill("#"));
    const rand = rng(seed);
    const stack = [[0, 0]];
    grid[1][1] = " ";
    const visited = new Set(["0,0"]);
    while (stack.length) {
        const [cx, cy] = stack[stack.length - 1];
        const opts = [];
        if (cy > 0 && !visited.has(`${cx},${cy - 1}`))
            opts.push([cx, cy - 1, cx, cy - 1]);
        if (cy < height - 1 && !visited.has(`${cx},${cy + 1}`))
            opts.push([cx, cy + 1, cx, cy + 1]);
        if (cx > 0 && !visited.has(`${cx - 1},${cy}`))
            opts.push([cx - 1, cy, cx - 1, cy]);
        if (cx < width - 1 && !visited.has(`${cx + 1},${cy}`))
            opts.push([cx + 1, cy, cx + 1, cy]);
        if (!opts.length) {
            stack.pop();
            continue;
        }
        const [nx, ny, wx, wy] = opts[Math.floor(rand() * opts.length)];
        grid[ny * 2 + 1][nx * 2 + 1] = " ";
        grid[cy * 2 + 1 + (ny - cy)][cx * 2 + 1 + (nx - cx)] = " ";
        visited.add(`${nx},${ny}`);
        stack.push([nx, ny]);
        void wx;
        void wy;
    }
    grid[0][1] = " ";
    grid[h - 1][w - 2] = " ";
    return grid.map((r) => r.join(""));
}
export async function generateMaze(a) {
    const rows = build(a.width, a.height, a.seed);
    return [`Maze ${a.width}x${a.height}, seed ${a.seed}`, "```", ...rows, "```"].join("\n");
}
function parseMaze(rows) {
    const width = Math.max(...rows.map((r) => r.length));
    if (rows.some((r) => r.length !== width))
        throw new SourceError("all maze rows must have the same length");
    const grid = rows.map((r) => r.replace(/\./g, " "));
    let entry = null;
    let exit = null;
    for (let x = 0; x < width; x++)
        if (grid[0][x] === " ") {
            entry = { x, y: 0 };
            break;
        }
    for (let x = width - 1; x >= 0; x--)
        if (grid[grid.length - 1][x] === " ") {
            exit = { x, y: grid.length - 1 };
            break;
        }
    if (!entry)
        throw new SourceError("maze has no opening in the top row");
    if (!exit)
        throw new SourceError("maze has no opening in the bottom row");
    return { grid, entry, exit };
}
export async function solveMaze(a) {
    const { grid, entry, exit } = parseMaze(a.maze);
    const h = grid.length;
    const w = grid[0].length;
    const key = (x, y) => `${x},${y}`;
    const prev = new Map();
    prev.set(key(entry.x, entry.y), null);
    const q = [entry];
    let found = false;
    while (q.length) {
        const p = q.shift();
        if (p.x === exit.x && p.y === exit.y) {
            found = true;
            break;
        }
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = p.x + dx, ny = p.y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h)
                continue;
            if (grid[ny][nx] !== " ")
                continue;
            if (prev.has(key(nx, ny)))
                continue;
            prev.set(key(nx, ny), key(p.x, p.y));
            q.push({ x: nx, y: ny });
        }
    }
    if (!found)
        return "No path from the top opening to the bottom opening.";
    const out = grid.map((r) => r.split(""));
    let cur = key(exit.x, exit.y);
    let steps = 0;
    while (cur) {
        const [x, y] = cur.split(",").map(Number);
        out[y][x] = "*";
        cur = prev.get(cur) ?? null;
        steps++;
    }
    return [`Solved in ${steps} cells:`, "```", ...out.map((r) => r.join("")), "```"].join("\n");
}
export async function mazeStats(a) {
    const rows = a.maze;
    const w = Math.max(...rows.map((r) => r.length));
    let open = 0, walls = 0, deadEnds = 0;
    for (let y = 0; y < rows.length; y++) {
        for (let x = 0; x < w; x++) {
            const ch = rows[y][x] ?? "#";
            if (ch === "#") {
                walls++;
                continue;
            }
            open++;
            let exits = 0;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= w || ny >= rows.length)
                    continue;
                if ((rows[ny][nx] ?? "#") !== "#")
                    exits++;
            }
            if (exits === 1)
                deadEnds++;
        }
    }
    return [
        `Size: ${w}x${rows.length}`,
        `Open cells: ${open}`,
        `Walls: ${walls}`,
        `Dead ends: ${deadEnds}`,
        `Fill: ${((open / (w * rows.length)) * 100).toFixed(1)}%`,
    ].join("\n");
}
