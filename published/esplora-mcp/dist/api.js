// ---- gap4e3 tools:
export {};

const MEMPOOL_TIP = 'https://mempool.space/api/v1/difficulty-adjustment';
export async function difficultyAdjustment() {
    const res = await fetch(MEMPOOL_TIP, {
        headers: { 'User-Agent': 'mrfentmen-esplora-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`mempool.space returned ${res.status}`);
    const d = (await res.json());
    if (typeof d.progressPercent !== 'number')
        throw new Error('mempool.space returned no difficulty adjustment data');
    const eta = typeof d.estimatedRetargetDate === 'number' ? new Date(d.estimatedRetargetDate).toISOString().slice(0, 16).replace('T', ' ') : 'unknown';
    const hours = typeof d.remainingTime === 'number' ? (d.remainingTime / 3600000).toFixed(1) : '?';
    return [
        `Difficulty retarget ${Number(d.progressPercent).toFixed(1)}% complete`,
        `Projected change: ${Number(d.difficultyChange).toFixed(2)}%`,
        `Estimated retarget: ${eta} UTC · ${d.remainingBlocks ?? '?'} block(s), about ${hours} h`,
        `Next retarget height: ${d.nextRetargetHeight ?? '?'} · previous change ${typeof d.previousRetarget === 'number' ? d.previousRetarget.toFixed(2) + '%' : '?'}`,
        `Average block time this epoch: ${typeof d.timeAvg === 'number' ? (d.timeAvg / 60000).toFixed(2) + ' min' : '?'}`,
    ].join('\n');
}
