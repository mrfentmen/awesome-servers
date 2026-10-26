export class LemonError extends Error {
    constructor(message) {
        super(message);
        this.name = "LemonError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.lemonsqueezy.com/v1";
function headers() {
    const k = process.env.LEMONSQUEEZY_API_KEY;
    if (!k)
        throw new LemonError("Set LEMONSQUEEZY_API_KEY (Lemon Squeezy test mode).");
    return { ...UA, Accept: "application/vnd.api+json", Authorization: `Bearer ${k}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
    }
    catch (e) {
        throw new LemonError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new LemonError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
export function listStores() {
    return get("/stores");
}
export function listProducts(storeId) {
    const q = storeId ? `?filter[store_id]=${encodeURIComponent(storeId)}` : "";
    return get(`/products${q}`);
}
export function getProduct(productId) {
    return get(`/products/${encodeURIComponent(productId)}`);
}
// ---- muxF tools:
// Both of these are arithmetic on the numbers the caller supplies and the
// published payout rules, so they never touch the API and need no key.
const money = (value) => Math.round(Number(value) * 100) / 100;
const pct = (value) => Math.round(Number(value) * 1000) / 10;
function currencyCode(value) {
    const code = String(value ?? "USD").trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code))
        throw new LemonError(`"${value}" is not a three-letter currency code.`);
    return code;
}
function amountOr(value, fallback, label) {
    if (value === undefined || value === null || value === "")
        return fallback;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0)
        throw new LemonError(`${label} must be a positive number, got "${value}".`);
    return n;
}
export function feeBreakdown(args = {}) {
    const gross = Number(args.gross);
    if (!Number.isFinite(gross) || gross <= 0)
        throw new LemonError("Give the gross sale amount as a positive number.");
    const currency = currencyCode(args.currency);
    const rate = amountOr(args.percentage_fee, 0.05, "percentage_fee");
    const fixed = amountOr(args.fixed_fee, 0.5, "fixed_fee");
    const conversion = amountOr(args.currency_fee, 0, "currency_fee");
    const tax = amountOr(args.tax_withheld, 0, "tax_withheld");
    const refund = amountOr(args.refund, 0, "refund");
    if (rate > 1)
        throw new LemonError(`percentage_fee is a share, not a percentage: use 0.05 for 5%, not ${rate}.`);
    if (refund > gross)
        throw new LemonError(`A refund of ${refund} cannot be larger than the ${gross} sale.`);
    const percentage = money(gross * rate);
    const totalFees = money(percentage + fixed + conversion + tax);
    const net = money(gross - totalFees - refund);
    const takeRate = gross > 0 ? (gross - net) / gross : 0;
    const ladder = [1, 2, 5].map((share) => ({
        share_of_sale_pct: share,
        sale_size: money((fixed + conversion) / (share / 100)),
    }));
    return JSON.stringify({
        currency,
        gross: money(gross),
        fees: {
            percentage: percentage,
            percentage_rate: rate,
            fixed: money(fixed),
            currency_conversion: money(conversion),
            tax_withheld: money(tax),
            refund: money(refund),
            total: money(totalFees + refund),
        },
        net_payout: net,
        effective_take_rate_pct: pct(takeRate),
        fixed_fee_break_even: ladder,
        note: `Net assumes the percentage fee applies to the gross sale, and that refunds and withheld tax are not paid out. The break-even rows are the sale sizes at which the fixed and conversion fees fall to that share of the sale.`,
    }, null, 2);
}
const CADENCES = ["daily", "weekly", "biweekly", "monthly"];
function parseAnchor(value) {
    if (value === undefined || value === null || value === "")
        return new Date();
    const text = String(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text))
        throw new LemonError(`from_date must be YYYY-MM-DD, got "${text}".`);
    const date = new Date(`${text}T00:00:00Z`);
    if (Number.isNaN(date.getTime()))
        throw new LemonError(`"${text}" is not a real date.`);
    return date;
}
function addMonths(date, months) {
    const day = date.getUTCDate();
    const shifted = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
    const lastDay = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0)).getUTCDate();
    return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), Math.min(day, lastDay)));
}
function nextDate(date, cadence) {
    if (cadence === "daily")
        return new Date(date.getTime() + 86400000);
    if (cadence === "weekly")
        return new Date(date.getTime() + 7 * 86400000);
    if (cadence === "biweekly")
        return new Date(date.getTime() + 14 * 86400000);
    return addMonths(date, 1);
}
const isoDay = (date) => date.toISOString().slice(0, 10);
export function payoutSchedule(args = {}) {
    const cadence = String(args.cadence ?? "monthly").trim().toLowerCase();
    if (!CADENCES.includes(cadence))
        throw new LemonError(`cadence must be one of ${CADENCES.join(', ')}, got "${cadence}".`);
    const currency = currencyCode(args.currency);
    const periods = Math.min(Math.max(Number(args.periods ?? 6) || 6, 1), 12);
    const threshold = amountOr(args.min_threshold, 0, "min_threshold");
    const reserveRate = amountOr(args.reserve_rate, 0, "reserve_rate");
    if (reserveRate > 1)
        throw new LemonError(`reserve_rate is a share, not a percentage: use 0.05 for 5%, not ${reserveRate}.`);
    const anchor = parseAnchor(args.from_date);
    let balance = amountOr(args.starting_balance, 0, "starting_balance");
    let reserveHeld = 0;
    const rows = [];
    let firstRelease = null;
    let date = anchor;
    for (let i = 0; i < periods; i += 1) {
        date = nextDate(date, cadence);
        const eligible = balance >= threshold && balance > 0;
        const released = eligible ? money(balance * (1 - reserveRate)) : 0;
        const held = eligible ? money(balance * reserveRate) : 0;
        if (eligible) {
            reserveHeld = money(reserveHeld + held);
            if (firstRelease === null)
                firstRelease = date;
            balance = 0;
        }
        rows.push({
            payout_date: isoDay(date),
            balance_before: eligible ? money(released + held) : money(balance),
            eligible,
            released,
            reserve_added: held,
        });
    }
    const floatDays = firstRelease ? Math.round((firstRelease.getTime() - anchor.getTime()) / 86400000) : null;
    return JSON.stringify({
        currency,
        cadence,
        anchor_date: isoDay(anchor),
        minimum_threshold: money(threshold),
        reserve_rate: reserveRate,
        starting_balance: money(amountOr(args.starting_balance, 0, "starting_balance")),
        payouts: rows,
        released_total: money(rows.reduce((sum, r) => sum + r.released, 0)),
        reserve_held_total: money(reserveHeld),
        first_release_date: firstRelease ? isoDay(firstRelease) : null,
        float_days: floatDays,
        note: threshold > 0
            ? `No sales are assumed: the schedule shows when the starting balance clears the ${threshold} ${currency} threshold and how long that float sits. A balance below the threshold carries over unchanged.`
            : "No sales are assumed and no minimum threshold applies, so the starting balance is released at the first payout date.",
    }, null, 2);
}
