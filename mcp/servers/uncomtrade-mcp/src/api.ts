const UA = 'mrfentmen-uncomtrade-mcp/1.0';

export interface TradeArgs {
  reporter: number;
  period?: string;
  limit?: number;
}

export async function trade(args: TradeArgs): Promise<string> {
  const reporter = Number(args.reporter);
  if (!Number.isFinite(reporter) || reporter <= 0) return 'Provide a reporter code like 842 (USA).';
  const period = (args?.period ?? '2023').trim();
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30);
  const url = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${reporter}&period=${encodeURIComponent(period)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`UN Comtrade returned ${res.status}`);
  const d = (await res.json()) as { count?: number; data?: Array<{ cmdCode?: string; cmdDescE?: string; primaryValue?: number; netWgt?: number }> };
  const data = d.data ?? [];
  if (!data.length) return `No UN Comtrade data for reporter ${reporter} in ${period}.`;
  return `UN Comtrade preview for reporter ${reporter} in ${period} (${d.count ?? data.length} records, showing ${Math.min(limit, data.length)}):\n` +
    data.slice(0, limit).map((x, i) => `${i + 1}. [${x.cmdCode ?? '?'}] ${x.cmdDescE ?? '?'} | value: ${x.primaryValue ?? '?'} | weight: ${x.netWgt ?? '?'}`).join('\n');
}

// ---- muxC tools:

interface ComtradeArea {
  id?: number
  text?: string
  PartnerCode?: number
  PartnerDesc?: string
  PartnerCodeIsoAlpha2?: string
  PartnerCodeIsoAlpha3?: string
  isGroup?: boolean
}

interface ComtradeCode {
  id?: string
  text?: string
  parent?: string
  isLeaf?: string
  aggrlevel?: number
}

