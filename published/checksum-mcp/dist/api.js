export * from "./local-api.js";
// ---- gap4e1 tools:

export async function npmIntegrity(args = {}) {
    const name = String(args?.package ?? 'typescript').trim();
    if (!name || name.length > 214)
        throw new Error('Give an npm package name, like typescript.');
    const res = await fetch(`https://registry.npmjs.org/${name.replace('/', '%2F')}/latest`, {
        headers: { 'User-Agent': 'mrfentmen-checksum-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new Error(`npm has no package "${name}"`);
    if (!res.ok)
        throw new Error(`npm registry returned ${res.status}`);
    const d = (await res.json());
    const dist = d.dist ?? {};
    return [
        `${d.name} ${d.version ?? '?'}`,
        `integrity: ${dist.integrity ?? 'not published'}`,
        `shasum (sha1): ${dist.shasum ?? 'not published'}`,
        `Tarball: ${dist.tarball ?? '?'}`,
        `Unpacked size: ${dist.unpackedSize ? Math.round(dist.unpackedSize / 1024) + ' KB' : '?'}`,
        `Published: ${String(d._npmUser ? '' : '')}${dist.signatures ? 'signed' : 'unsigned'}`,
    ].filter(Boolean).join('\n');
}
