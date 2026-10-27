const UA = 'mrfentmen-esm-mcp/1.0';
export async function resolve(args) {
    const name = String(args.name).trim();
    if (!name)
        throw new Error('Provide a package name.');
    const version = args.version ? `@${encodeURIComponent(args.version)}` : '';
    const url = `https://esm.sh/${encodeURIComponent(name)}${version}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/javascript' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`esm.sh returned ${res.status}`);
    const body = await res.text();
    const firstLine = body.split('\n')[0] ?? '';
    const m = firstLine.match(/esm\.sh - (.+?)\s*\*\//);
    return `esm.sh module for ${args.name}${version ? `@${version}` : ''}:\n${m ? `Version: ${m[1]}` : 'Version: resolved'}\nURL: ${url}\nSize: ${body.length} bytes\nExports: ${(body.match(/export \{([^}]*)\}/)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 12).join(', ') || 'named exports (see URL)'}`;
}
export async function browse(args) {
    const name = String(args.name).trim();
    if (!name)
        throw new Error('Provide a package name.');
    const version = args.version ? `@${encodeURIComponent(args.version)}` : '';
    const path = args.path ? `/${args.path.replace(/^\//, '')}` : '';
    const url = `https://esm.sh/${encodeURIComponent(name)}${version}${path}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/javascript,text/plain' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`esm.sh returned ${res.status}`);
    const body = await res.text();
    return `esm.sh ${args.name}${version ? `@${version}` : ''}${path}:\nURL: ${url}\nSize: ${body.length} bytes\nFirst lines:\n${body.split('\n').slice(0, 8).join('\n')}`;
}
// ---- muxA tools:
const ESM = "https://esm.sh";
function cap(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
async function esmFetch(url, accept = "application/javascript") {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: accept },
        signal: AbortSignal.timeout(25000),
    });
    const body = res.ok ? await res.text() : "";
    return { ok: res.ok, status: res.status, body, size: body.length };
}
function targetOf(stub) {
    const m = stub.match(/from\s+"(\/[^"]+\.mjs)"/) ?? stub.match(/import\s+"(\/[^"]+\.mjs)"/);
    return m?.[1] ?? "";
}
function versionOf(stub) {
    return /esm\.sh\s*-\s*(.+?)\s*\*\//.exec(stub)?.[1]?.trim() ?? "resolved";
}
function bytes(n) {
    if (n == null)
        return "unknown";
    if (n >= 1024 * 1024)
        return `${(n / 1024 / 1024).toFixed(2)} MB`;
    if (n >= 1024)
        return `${(n / 1024).toFixed(1)} kB`;
    return `${n} B`;
}
export async function versionRange(args) {
    const name = String(args.name ?? "").trim();
    if (!name)
        throw new Error("Provide a package name.");
    const range = String(args.range ?? "").trim();
    if (!range)
        throw new Error("Provide a semver range such as ^4.17.0 or ~1.2.0.");
    const wanted = [range];
    if (args.compare?.trim())
        wanted.push(args.compare.trim());
    const out = [`esm.sh semver resolution for ${name}:`];
    for (const r of wanted) {
        const url = `${ESM}/${encodeURIComponent(name)}@${encodeURIComponent(r)}`;
        const res = await esmFetch(url);
        if (!res.ok) {
            out.push(`  ${r} -> HTTP ${res.status}, the range did not resolve`);
            continue;
        }
        out.push(`  ${r} -> ${versionOf(res.body)} | stub ${bytes(res.size)} | ${targetOf(res.body) || "no module path in stub"}`);
    }
    const lines = out.slice(1);
    const resolved = lines.map((l) => l.split(" -> ")[1]?.split(" |")[0]?.trim()).filter(Boolean);
    if (resolved.length > 1) {
        out.push(resolved.every((v) => v === resolved[0])
            ? "Both ranges resolve to the same published version, so pinning to that version is safe."
            : `The ranges resolve to different versions (${[...new Set(resolved)].join(" and ")}), so a floating range can change the code you ship.`);
    }
    return out.join("\n");
}
