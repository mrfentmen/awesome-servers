export class LemonError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LemonError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.lemonsqueezy.com/v1";

function headers(): Record<string, string> {
  const k = process.env.LEMONSQUEEZY_API_KEY;
  if (!k) throw new LemonError("Set LEMONSQUEEZY_API_KEY (Lemon Squeezy test mode).");
  return { ...UA, Accept: "application/vnd.api+json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new LemonError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new LemonError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listStores(): Promise<string> {
  return get("/stores");
}

export function listProducts(storeId?: string): Promise<string> {
  const q = storeId ? `?filter[store_id]=${encodeURIComponent(storeId)}` : "";
  return get(`/products${q}`);
}

export function getProduct(productId: string): Promise<string> {
  return get(`/products/${encodeURIComponent(productId)}`);
}

// ---- muxG tools:
const LS_MAX_SCHEDULE = 12

const lsCents = (value: number): number => Math.round(value * 100) / 100

const lsMoney = (value: number, currency: string): string => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(lsCents(value));
  } catch {
    return `${lsCents(value).toFixed(2)} (currency ${currency} is not a valid ISO code)`;
  }
}

const lsNumber = (value: unknown, label: string, min: number, max: number): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new LemonError(`${label} must be a number.`);
  if (n < min || n > max) throw new LemonError(`${label} must be between ${min} and ${max}.`);
  return n;
}

export interface FeeBreakdownArgs {
  gross: number;
  percentage_fee?: number;
  fixed_fee?: number;
  currency_fee?: number;
  tax_withheld?: number;
  refund?: number;
  currency?: string;
}

/** Where a sale's money actually goes: every fee, the net payout, the effective take rate and the size of sale that pays for the fixed fees. */
export async function feeBreakdown(args: FeeBreakdownArgs): Promise<string> {
  const currency = typeof args?.currency === "string" && /^[A-Za-z]{3}$/.test(args.currency) ? args.currency.toUpperCase() : "USD";
  const gross = lsNumber(args?.gross, "gross", -1e9, 1e9);
  const percentageRate = lsNumber(args?.percentage_fee ?? 0, "percentage_fee", 0, 1);
  const fixed = lsNumber(args?.fixed_fee ?? 0, "fixed_fee", 0, 1e6);
  const currencyFee = lsNumber(args?.currency_fee ?? 0, "currency_fee", 0, 1e6);
  const tax = lsNumber(args?.tax_withheld ?? 0, "tax_withheld", 0, 1e9);
  const refund = lsNumber(args?.refund ?? 0, "refund", 0, Math.max(0, gross));

  const percentageFee = lsCents(Math.max(0, gross) * percentageRate);
  const fees = lsCents(percentageFee + fixed + currencyFee + tax);
  const net = lsCents(gross - fees - refund);
  const totalFee = lsCents(fees + refund);
  const takeRate = gross > 0 ? (totalFee / gross) * 100 : Number.NaN;
  // the sale size at which the fixed and currency fees eat percentage of one
  const variableRate = lsCents(percentageRate + tax / Math.max(gross, 1));
  const breakEven = variableRate > 0 && variableRate < 1 ? lsCents((fixed + currencyFee) / (1 - variableRate)) : null;

  const lines = [
    `Fee breakdown on a ${lsMoney(gross, currency)} sale, priced in ${currency}`,
    "",
    `  gross                      ${lsMoney(gross, currency).padStart(14)}`,
    `  percentage fee ${(percentageRate * 100).toFixed(2).padStart(6)}%      ${lsMoney(-percentageFee, currency).padStart(14)}`,
    `  fixed fee                  ${lsMoney(-fixed, currency).padStart(14)}`,
    `  currency conversion fee    ${lsMoney(-currencyFee, currency).padStart(14)}`,
    `  tax withheld               ${lsMoney(-tax, currency).padStart(14)}`,
    refund ? `  refund                    ${lsMoney(-refund, currency).padStart(14)}` : "  no refund",
    `  net payout                 ${lsMoney(net, currency).padStart(14)}`,
    "",
    `Total cost of the sale: ${lsMoney(totalFee, currency)}, an effective take rate of ${Number.isFinite(takeRate) ? `${takeRate.toFixed(2)}%` : "not computable at zero gross"}.`,
  ];
  if (refund) {
    const refundedFeeShare = lsCents(percentageRate * refund);
    lines.push(`A ${lsMoney(refund, currency)} refund also gave back about ${lsMoney(refundedFeeShare, currency)} of percentage fee, so the real cost of the refund is lower than its face value.`);
  }
  if (breakEven !== null) {
    lines.push(`Fixed and currency fees stop being noticeable above a sale of about ${lsMoney(breakEven, currency)}; below that, they take more than the percentage fee.`);
  } else if (fixed || currencyFee) {
    lines.push("With a 100% variable rate, there is no break-even sale size: the fixed fees always dominate.");
  }
  lines.push("");
  lines.push("Computed from the figures you passed. Lemon Squeezy's own rates were not fetched, and a merchant's negotiated rate is often lower than the list rate.");
  return lines.join("\n");
}

export interface PayoutScheduleArgs {
  cadence: string;
  min_threshold?: number;
  reserve_rate?: number;
  periods?: number;
  starting_balance?: number;
  currency?: string;
  from_date?: string;
}

const nextWeekday = (from: Date, weekday: number, stepWeeks: number): Date => {
  const date = new Date(from.getTime());
  const delta = (weekday - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + delta + stepWeeks * 7);
  return date;
}

const addMonths = (from: Date, months: number): Date => {
  const date = new Date(from.getTime());
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date;
}

/** When money would actually arrive: the payout cadence, the minimum threshold and any rolling reserve, worked out over real dates. */
export async function payoutSchedule(args: PayoutScheduleArgs): Promise<string> {
  const currency = typeof args?.currency === "string" && /^[A-Za-z]{3}$/.test(args.currency) ? args.currency.toUpperCase() : "USD";
  const cadence = String(args?.cadence ?? "monthly").trim().toLowerCase();
  if (!["daily", "weekly", "biweekly", "monthly"].includes(cadence)) {
    throw new LemonError("cadence must be one of daily, weekly, biweekly or monthly.");
  }
  const threshold = lsNumber(args?.min_threshold ?? 0, "min_threshold", 0, 1e12);
  const reserveRate = lsNumber(args?.reserve_rate ?? 0, "reserve_rate", 0, 0.9);
  const periods = Math.min(Math.max(Math.round(Number(args?.periods ?? 6) || 6), 1), LS_MAX_SCHEDULE);
  const balance = lsNumber(args?.starting_balance ?? 0, "starting_balance", -1e12, 1e12);

  let anchor: Date;
  if (args?.from_date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.from_date)) throw new LemonError("from_date must be YYYY-MM-DD.");
    anchor = new Date(`${args.from_date}T00:00:00Z`);
    if (Number.isNaN(anchor.getTime())) throw new LemonError("from_date is not a real date.");
  } else {
    anchor = new Date();
  }

  const dates: Date[] = [];
  for (let i = 0; i < periods; i += 1) {
    if (cadence === "daily") {
      const date = new Date(anchor.getTime());
      date.setUTCDate(date.getUTCDate() + i + 1);
      dates.push(date);
    } else if (cadence === "weekly") {
      dates.push(nextWeekday(anchor, 1, i));
    } else if (cadence === "biweekly") {
      dates.push(nextWeekday(anchor, 1, i * 2));
    } else {
      dates.push(addMonths(anchor, i + 1));
    }
  }

  const held = lsCents(Math.max(0, balance) * reserveRate);
  const released = lsCents(Math.max(0, balance - held));
  const lines = [
    `Payout schedule on a ${cadence} cadence, anchored on ${anchor.toISOString().slice(0, 10)}`,
    `Minimum threshold ${lsMoney(threshold, currency)}${reserveRate ? ` · reserve ${(reserveRate * 100).toFixed(1)}%` : " · no reserve"}`,
    "",
    `  balance before the reserve  ${lsMoney(balance, currency).padStart(14)}`,
    `  held back as reserve        ${lsMoney(-held, currency).padStart(14)}`,
    `  available for payout        ${lsMoney(released, currency).padStart(14)}`,
    `  first payout                 ${released < threshold ? lsMoney(0, currency) : lsMoney(released, currency)} on ${dates[0].toISOString().slice(0, 10)}`,
    "",
    "Cadence:",
  ];
  for (const [i, date] of dates.entries()) {
    const label = date.toISOString().slice(0, 10);
    const gap = Math.round((date.getTime() - anchor.getTime()) / 86_400_000);
    lines.push(`  ${i + 1}. ${label} (${gap} day(s) after the anchor)`);
  }
  if (released < threshold) {
    lines.push("");
    lines.push(`The balance stays under the ${lsMoney(threshold, currency)} threshold, so no payout is made until sales push it over.`);
  } else if (reserveRate) {
    lines.push("");
    lines.push(`The reserve is released on top of each payout, so the account has to clear the threshold again after every payment.`);
  }
  lines.push("");
  lines.push("Computed from the cadence, threshold and reserve you passed. Real processors also apply fraud holds, refunds in flight and currency conversion delays.");
  return lines.join("\n");
}
