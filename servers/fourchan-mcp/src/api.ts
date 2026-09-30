/**
 * 4chan client — the read-only JSON API on a.4cdn.org (no key).
 * Docs: https://github.com/4chan/4chan-API
 * JSON mirrors the HTML: posts are objects with numeric keys; `com` is
 * HTML that we flatten for display.
 */
const BASE = "https://a.4cdn.org"

export class ChanError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "fourchan-mcp/1.0" },
  })
  if (res.status === 404) throw new ChanError(`4chan: nothing at ${path} (bad board or thread)`)
  if (!res.ok) throw new ChanError(`4chan API error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Board {
  board: string
  title: string
  sfw: boolean
  description?: string
}

export interface ThreadSummary {
  no: number
  sub?: string
  com?: string
  replies: number
  images: number
  lastModified?: number
}

export interface Post {
  no: number
  com?: string
  name?: string
  time?: number
  replies?: number
  images?: number
  filename?: string
  tim?: number
  ext?: string
  w?: number
  h?: number
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function listBoards(): Promise<Board[]> {
  const d = await getJson<{ boards?: any[] }>("/boards.json")
  return (d.boards ?? []).map((b) => ({
    board: b.board ?? "",
    title: b.title ?? "?",
    sfw: !!b.is_worksafe,
    description: b.meta_description,
  }))
}

export async function getCatalog(board: string): Promise<ThreadSummary[]> {
  const pages = await getJson<any[]>(`/${encodeURIComponent(board)}/catalog.json`)
  const threads: ThreadSummary[] = []
  for (const page of pages) {
    for (const t of page.threads ?? []) {
      threads.push({
        no: t.no ?? 0,
        sub: t.sub,
        com: t.com ? stripHtml(t.com) : undefined,
        replies: t.replies ?? 0,
        images: t.images ?? 0,
        lastModified: t.last_modified,
      })
    }
  }
  return threads
}

export async function getThread(board: string, threadNo: number): Promise<Post[]> {
  const d = await getJson<{ posts?: any[] }>(
    `/${encodeURIComponent(board)}/thread/${threadNo}.json`
  )
  return (d.posts ?? []).map((p) => ({
    no: p.no ?? 0,
    com: p.com ? stripHtml(p.com) : undefined,
    name: p.name,
    time: p.time,
    replies: p.replies,
    images: p.images,
    filename: p.filename ? `${p.filename}${p.ext ?? ""}` : undefined,
    tim: p.tim,
    ext: p.ext,
    w: p.w,
    h: p.h,
  }))
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function fmtChanTime(ts?: number): string {
  if (!ts) return ""
  return new Date(ts * 1000).toISOString().replace("T", " ").slice(0, 16) + " UTC"
}

export function formatThreadSummary(t: ThreadSummary, index: number): string {
  const lines = [
    `${index + 1}. [${t.no}] ${t.sub ?? "(no subject)"} — ${t.replies} replies / ${t.images} img`,
    t.com ? t.com.slice(0, 200) : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatPost(p: Post): string {
  const img = p.filename ? ` [img: ${p.filename}]` : ""
  return `#${p.no}${p.name ? ` by ${p.name}` : ""}${fmtChanTime(p.time)}${img}\n${p.com ?? "(no text)"}`
}

// ---- gap2c tools:

function needBoard(board: string | undefined): string {
  const value = (board ?? "").trim().toLowerCase()
  if (!value) throw new ChanError('Provide a board name, e.g. "g".')
  return value
}

interface IndexRow {
  no: number
  last_modified: number
  replies: number
  replies_img: number
  sticky: boolean
  closed: boolean
}

function toMb(bytes: number): string {
  return `${(bytes / 1048576).toFixed(2)} MB`
}

/**
 * The per-board limits 4chan publishes in `/boards.json`: paging, bump and image
 * caps, upload ceilings, cooldowns and whether the board is archived.
 */
export async function boardConfig(args: { board: string }): Promise<string> {
  const board = needBoard(args.board);
  const data = await getJson<{ boards?: Array<Record<string, any>> }>("/boards.json");
  const b = (data.boards ?? []).find((x) => String(x.board ?? "").toLowerCase() === board);
  if (!b) throw new ChanError(`4chan has no board /${board}/.`);
  const yes = (v: unknown) => (v ? "yes" : "no");
  const cooldowns = b.cooldowns ?? {};
  const lines = [
    `/${b.board}/ — ${b.title ?? "?"}`,
    b.meta_description ? `Description: ${String(b.meta_description).slice(0, 240)}` : "",
    `Worksafe: ${yes(b.ws_board)}`,
    `Pages: ${b.pages ?? "not reported"}, threads per page: ${b.per_page ?? "not reported"}`,
    `Bump limit: ${b.bump_limit ?? "not reported"} replies | Image limit: ${b.image_limit ?? "not reported"} images`,
    b.max_filesize ? `Max upload: ${b.max_filesize} bytes (${toMb(Number(b.max_filesize))})` : "",
    b.max_webm_filesize
      ? `Max webm: ${b.max_webm_filesize} bytes (${toMb(Number(b.max_webm_filesize))}), duration cap ${
          b.max_webm_duration ?? "not reported"
        } s`
      : "",
    b.max_comment_chars ? `Max comment: ${b.max_comment_chars} chars` : "",
    cooldowns.threads || cooldowns.replies || cooldowns.images
      ? `Cooldowns: thread ${cooldowns.threads ?? "?"} s, reply ${cooldowns.replies ?? "?"} s, image ${
          cooldowns.images ?? "?"
        } s`
      : "",
    `Archived: ${yes(b.is_archived)}`,
    `Code tags enabled: ${yes(b.code_tags)}`,
  ].filter(Boolean);
  return lines.join("\n");
}

