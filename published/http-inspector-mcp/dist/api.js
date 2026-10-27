const UA = "mrfentmen-http-inspector-mcp/1.0 (https://github.com/mrfentmen)";
export class HttpError extends Error {
}
export async function inspectUrl(args) {
    const url = (args.url ?? "").trim();
    if (!/^https?:\/\/.+/i.test(url))
        throw new HttpError("Provide a full URL starting with http or https");
    if (url.length > 2000)
        throw new HttpError("URL is too long");
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const headers = [
        "server", "content-type", "content-length", "cache-control",
        "etag", "last-modified", "x-powered-by", "set-cookie",
    ];
    const lines = headers
        .filter((h) => res.headers.get(h))
        .map((h) => `  ${h}: ${res.headers.get(h)?.slice(0, 120)}`);
    return [
        `URL: ${url}`,
        `Status: ${res.status} ${res.statusText}`,
        `Final URL: ${res.url}`,
        lines.length ? `\nHeaders:\n${lines.join("\n")}` : "",
    ].filter(Boolean).join("\n");
}
