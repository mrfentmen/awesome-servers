const UA = 'mrfentmen-bored-mcp/1.0';
const BASE = 'https://bored-api.appbrewery.com';
function fmt(a) {
    return `Activity: ${a.activity ?? '?'}\nType: ${a.type ?? '?'} | Participants: ${a.participants ?? '?'} | Price: ${a.price ?? '?'} | Accessibility: ${a.accessibility ?? '?'}`;
}
export async function randomActivity(_args) {
    const res = await fetch(`${BASE}/random`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Bored returned ${res.status}`);
    const d = (await res.json());
    if (!d.activity)
        return 'No activity returned.';
    return fmt(d);
}
export async function activityByType(args) {
    const res = await fetch(`${BASE}/filter?type=${encodeURIComponent(args.type)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Bored returned ${res.status}`);
    const d = (await res.json());
    const list = Array.isArray(d) ? d : [d];
    if (!list.length || !list[0]?.activity)
        return `No activities of type "${args.type}".`;
    return `Activities of type "${args.type}" (${list.length}):\n` + list.slice(0, 5).map((a, i) => `${i + 1}. ${a.activity}`).join('\n');
}
export async function activityByParticipants(args) {
    const n = Math.min(Math.max(Number(args.participants) || 1, 1), 8);
    const res = await fetch(`${BASE}/filter?participants=${n}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Bored returned ${res.status}`);
    const d = (await res.json());
    const list = Array.isArray(d) ? d : [d];
    if (!list.length || !list[0]?.activity)
        return `No activities for ${n} participants.`;
    return `Activities for ${n} participants (${list.length}):\n` + list.slice(0, 5).map((a, i) => `${i + 1}. ${a.activity} (${a.type ?? '?'})`).join('\n');
}
