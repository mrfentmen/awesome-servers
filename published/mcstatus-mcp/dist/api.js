const UA = 'mrfentmen-mcstatus-mcp/1.0';
export async function status(args) {
    const host = String(args.host).trim();
    if (!host)
        throw new Error('Provide a server host.');
    const port = Math.min(Math.max(Number(args?.port ?? 25565) || 25565, 1), 65535);
    const suffix = port === 25565 ? '' : `/${port}`;
    const res = await fetch(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(host)}${suffix}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`mcstatus.io returned ${res.status}`);
    const d = (await res.json());
    if (d.online == null)
        throw new Error('No status returned.');
    if (!d.online)
        return `Minecraft server ${host}:${port} is OFFLINE.\nIP: ${d.ip_address ?? '?'}`;
    const sample = (d.players?.list ?? []).slice(0, 8).map((p) => p.name_clean ?? '?').join(', ');
    const motdClean = Array.isArray(d.motd?.clean) ? d.motd.clean.join(' ') : d.motd?.clean ?? '';
    return `Minecraft server ${host}:${port} is ONLINE.\nVersion: ${d.version?.name_clean ?? d.version?.name_raw ?? '?'}\nPlayers: ${d.players?.online ?? 0}/${d.players?.max ?? 0}${sample ? `\nOnline: ${sample}` : ''}\nMOTD: ${motdClean.trim().slice(0, 150) || 'none'}\nIP: ${d.ip_address ?? '?'}`;
}
// ---- muxB tools:
const PROFILE = 'https://api.mojang.com/users/profiles/minecraft';
export async function playerProfile(args) {
    const name = (args.name ?? '').trim();
    if (!name)
        return 'Provide a Minecraft username.';
    const res = await fetch(`${PROFILE}/${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 204 || res.status === 404)
        return `No Minecraft profile found for "${name}".`;
    if (!res.ok)
        throw new Error(`Mojang profile API returned ${res.status}`);
    const d = (await res.json());
    if (!d.id)
        return `Mojang returned no profile id for "${name}".`;
    return `Minecraft profile for "${d.name ?? name}": UUID ${d.id}`;
}
