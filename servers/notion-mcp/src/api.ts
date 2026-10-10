export class NotionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotionError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

const VERSION = "2022-06-28";

function headers(): Record<string, string> {
  const k = process.env.NOTION_API_KEY;
  if (!k) throw new NotionError("Set NOTION_API_KEY (Notion integration token).");
  return { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${k}`, "Notion-Version": VERSION };
}

async function call(path: string, method: string, body?: Record<string, unknown>): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.notion.com/v1" + path, {
      method,
      headers: headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new NotionError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new NotionError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 12000);
}

export function search(query: string): Promise<string> {
  return call("/search", "POST", { query, page_size: 10 });
}

export function listUsers(): Promise<string> {
  return call("/users", "GET");
}

export function getPage(pageId: string): Promise<string> {
  return call(`/pages/${encodeURIComponent(pageId)}`, "GET");
}



export function queryDatabase(databaseId: string): Promise<string> {
  return call(`/databases/${encodeURIComponent(databaseId)}/query`, "POST", { page_size: 10 });
}

export function blockChildren(blockId: string): Promise<string> {
  return call(`/blocks/${encodeURIComponent(blockId)}/children?page_size=20`, "GET");
}

export function searchDatabases(query: string): Promise<string> {
  return call("/search", "POST", { query, filter: { property: "object", value: "database" }, page_size: 10 });
}

export function getUser(userId: string): Promise<string> {
  return call(`/users/${encodeURIComponent(userId)}`, "GET");
}

export function appendBlock(blockId: string, paragraph: string): Promise<string> {
  return call(`/blocks/${encodeURIComponent(blockId)}/children`, "PATCH", {
    children: [{ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: paragraph.slice(0, 1000) } }] } }],
  });
}

export function updatePageTitle(pageId: string, title: string): Promise<string> {
  return call(`/pages/${encodeURIComponent(pageId)}`, "PATCH", {
    properties: { title: { title: [{ text: { content: title.slice(0, 100) } }] } },
  });
}

export function createPage(parentPageId: string, title: string): Promise<string> {
  return call("/pages", "POST", {
    parent: { page_id: parentPageId },
    properties: { title: { title: [{ text: { content: title.slice(0, 100) } }] } },
  });
}

// ---- muxF tools:
/**
 * The Notion API needs an integration token. Two things about a Notion URL do
 * not: what the page publicly says it is, and whether the id in the URL is even
 * a well-formed Notion id.
 */
const NT_UA = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml",
};

const NT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NT_ID_KINDS: Array<{ label: string; pattern: RegExp }> = [
  { label: "page or database", pattern: NT_UUID },
  { label: "dashed 32-hex", pattern: /^[0-9a-f]{32}$/i },
  { label: "block comment id", pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}#.*$/i },
];

const ntMeta = (html: string, property: string): string | null => {
  const meta = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, "i").exec(html);
  if (meta?.[1]) return meta[1];
  const swapped = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, "i").exec(html);
  return swapped?.[1] ?? null;
};

/** Read what a public Notion page publishes about itself, without any token. */
export async function notionPageMetadata(args: { url: string }): Promise<string> {
  const raw = String(args?.url ?? "").trim();
  if (!/^https?:\/\/\S+\.notion\.(so|site|com)\/\S*/i.test(raw)) {
    throw new NotionError("Give a public Notion page URL, e.g. https://www.notion.so/workspace/Page-Title-83715d7703ee4b8699b4ba7b334859b6.");
  }
  const target = raw.startsWith("http") ? raw : `https://${raw}`;
  let res: Response;
  try {
    res = await fetch(target, { headers: { ...NT_UA }, redirect: "follow", signal: AbortSignal.timeout(30000) });
  } catch (e) {
    throw new NotionError(`Network error: ${(e as Error).message}`);
  }
  if (res.status === 404) throw new NotionError(`Notion returned 404 for that page. It may be private, deleted, or the URL may be wrong.`);
  if (res.status === 401 || res.status === 403) throw new NotionError(`Notion refused to serve the page without a session (HTTP ${res.status}).`);
  if (!res.ok) throw new NotionError(`Notion returned HTTP ${res.status}.`);
  const html = (await res.text()).slice(0, 4_000_000);
  if (!html.trim()) throw new NotionError("Notion returned an empty document.");

  const title = ntMeta(html, "og:title") ?? /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? null;
  const description = ntMeta(html, "og:description") ?? ntMeta(html, "description");
  const image = ntMeta(html, "og:image");
  const siteName = ntMeta(html, "og:site_name");
  const canonical = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(html)?.[1] ?? null;
  const robots = ntMeta(html, "robots");
  const finalUrl = res.url || target;
  const idMatches = html.match(NT_UUID);
  const notFound = /"errorId"|page not found|is not available/i.test(html.slice(0, 40_000));

  const lines = [
    `Public metadata for a Notion page`,
    `  requested: ${target.slice(0, 110)}`,
    `  final URL: ${finalUrl.slice(0, 110)}${finalUrl !== target ? " (redirected)" : ""}`,
    `  status ${res.status}, ${html.length} character(s) of HTML, site name: ${siteName ?? "not reported"}`,
    `  title: ${title ?? "not reported in the page metadata"}`,
    `  description: ${description ? `${description.slice(0, 220)}${description.length > 220 ? "..." : ""}` : "not reported"}`,
    `  social image: ${image ? image.slice(0, 100) : "not reported"}`,
    `  canonical: ${canonical ?? "not reported"}`,
    `  robots: ${robots ?? "not reported"}`,
  ];
  const pageId = /[?&](?:p|v|s)=([0-9a-f-]{32,36})/i.exec(finalUrl)?.[1] ?? finalUrl.match(NT_UUID)?.[0] ?? idMatches?.[0] ?? null;
  if (pageId) lines.push(`  page or database id visible in the response: ${pageId}`);
  lines.push("");
  lines.push(
    notFound
      ? "  The document loaded but carries a Notion error marker, so this page is not publicly readable."
      : "  This is only what the page publishes to any visitor. Content behind the page is not fetched, because that needs a token.",
  );
  return lines.join("\n");
}

/** Check the ids in a Notion URL or id list before spending an API call on them. */
export async function notionIdAudit(args: { ids: string }): Promise<string> {
  const raw = String(args?.ids ?? "").trim();
  const candidates = raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  if (!candidates.length) throw new NotionError("Paste one or more Notion ids or Notion URLs, separated by spaces or commas.");
  if (candidates.length > 20) throw new NotionError("Give at most 20 ids at a time.");

  const lines = [`Notion id audit of ${candidates.length} value(s)`];
  let wellFormed = 0;
  for (const value of candidates) {
    let subject = value;
    let fromUrl = false;
    if (/^https?:\/\//i.test(value) || /\.notion\.(so|site|com)\//i.test(value)) {
      fromUrl = true;
      subject = value;
    }
    const bare = subject.replace(/^https?:\/\/[^/]+\//i, "").split(/[?#]/)[0];
    const dashed = bare.match(NT_UUID)?.[0] ?? null;
    const hex32 = (bare.match(/[0-9a-f]{32}/i) ?? [])[0] ?? null;
    const kind = NT_ID_KINDS.find((k) => k.pattern.test(bare))?.label ?? null;
    const slug = bare.replace(/^[0-9a-f-]{32,36}/, "").replace(/^-/, "");
    const version = dashed ? Number(dashed.split("-")[2][0]) : null;

    if (dashed || hex32) {
      wellFormed += 1;
      const shown = dashed ?? `${hex32!.slice(0, 8)}-${hex32!.slice(8, 12)}-${hex32!.slice(12, 16)}-${hex32!.slice(16, 20)}-${hex32!.slice(20)}`;
      lines.push(
        `  ${shown}  well-formed ${dashed ? `UUID${version !== null ? ` v${version}` : ""}` : "32-hex, which Notion accepts dashed"}${fromUrl ? `, from URL, page slug "${slug || "none"}"` : ""}`,
      );
    } else {
      lines.push(`  ${bare.slice(0, 60)}  no Notion id found in this value${fromUrl ? ` (URL slug "${slug || "none"}")` : ""}`);
    }
  }
  lines.push("");
  lines.push(`  ${wellFormed} of ${candidates.length} value(s) carry a syntactically valid Notion id.`);
  lines.push("  A well-formed id proves nothing: Notion answers 404 for an id that exists but the token cannot see, and object_not_found for one that does not exist.");
  return lines.join("\n");
}
