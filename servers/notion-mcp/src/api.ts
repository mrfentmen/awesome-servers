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
