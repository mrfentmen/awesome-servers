const COLLECTIONS = "https://index.commoncrawl.org/collinfo.json"
const HEADERS = { "User-Agent": "mrfentmen-commoncrawl-mcp/1.0" }

export class CommonCrawlError extends Error {}

type Collection = { id?: string; name?: string; timegate?: string; cd?: string }

async function getJson(url: URL, timeout = 30000): Promise<unknown> {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeout) })
  if (!response.ok) throw new CommonCrawlError(`Common Crawl error ${response.status}`)
  return response.json()
}

export async function listCollections(): Promise<Collection[]> {
  return (await getJson(new URL(COLLECTIONS))) as Collection[]
}

export async function latestIndex(): Promise<string> {
  const collections = await listCollections()
  const id = collections[0]?.id
  if (!id) throw new CommonCrawlError("Common Crawl returned no index collections")
  return id
}

export async function searchCaptures(urlPattern: string, index: string | undefined, page: number, limit: number) {
  const selectedIndex = index || await latestIndex()
  const url = new URL(`https://index.commoncrawl.org/${encodeURIComponent(selectedIndex)}-index`)
  url.searchParams.set("url", urlPattern)
  url.searchParams.set("output", "json")
  url.searchParams.set("page", String(page))
  url.searchParams.set("fl", "url,timestamp,status,mime,mime-detected,digest,filename,offset,length")
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new CommonCrawlError(`Common Crawl index error ${response.status}`)
  const body = await response.text()
  const records = body.split("\\n").filter(Boolean).slice(0, limit).map((line) => {
    try { return JSON.parse(line) } catch { return { raw: line.slice(0, 1000) } }
  })
  return { index: selectedIndex, page, count: records.length, records }
}

export function format(value: unknown): string {
  return JSON.stringify(value, null, 2).slice(0, 16000)
}
